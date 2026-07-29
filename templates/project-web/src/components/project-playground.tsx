"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction
} from "react";
import {
  AlertCircleIcon,
  ArrowUpIcon,
  MessageCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  XIcon
} from "lucide-react";
import type {
  ChatSearchChunk,
  QueryRecommendationResponse,
  RecommendResponse,
  SearchResponse
} from "@volcengine/search-node";

import { MarkdownMessage } from "@/components/markdown-message";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from "@/components/ui/message-scroller";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  TypographyH1,
  TypographyListItem,
  TypographyMuted,
  TypographyOrderedList,
  TypographyP,
  TypographySmall
} from "@/components/ui/typography";
import { postJson, streamChat } from "@/lib/client/api";
import type { ProjectFeature } from "@/lib/project";
import { cn } from "@/lib/utils";

type FeatureId = ProjectFeature;

type ConfigResponse = {
  features: FeatureId[];
};

type SearchApiResponse = SearchResponse & {
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_more?: boolean;
};

type SearchResultItem = NonNullable<SearchResponse["search_results"]>[number];
type RecommendResultItem = NonNullable<RecommendResponse["rec_results"]>[number];
type ResultItemData = SearchResultItem | RecommendResultItem;

type AsyncState<TData> =
  | { status: "idle" }
  | { status: "loading"; data?: TData }
  | { status: "ready"; data: TData }
  | { status: "error"; error: string; data?: TData };

type ConfigState =
  | { status: "loading" }
  | { status: "ready"; data: ConfigResponse }
  | { status: "error" };

type TabItem = {
  id: FeatureId;
  label: string;
};

type SearchState = AsyncState<SearchApiResponse>;
type QueryRecommendationState = AsyncState<QueryRecommendationResponse>;
type RecommendState = AsyncState<RecommendResponse>;

type SearchImage = {
  dataUrl: string;
};

type SearchInput = {
  query: string;
  image?: SearchImage;
};

type ChatMessageRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  suggestions: string[];
  pending?: boolean;
  error?: string;
};

type NormalizedResult = {
  key: string;
  title: string;
  description?: string;
  imageUrl?: string;
  metadata: string[];
};

const initialSearchState: SearchState = { status: "idle" };
const initialQueryRecommendationState: QueryRecommendationState = { status: "idle" };
const initialRecommendState: RecommendState = { status: "idle" };

const titleFields = [
  "title",
  "name",
  "product_name",
  "item_name",
  "doc_title",
  "document_title",
  "headline",
  "question",
  "subject"
];

const tabContentFrameClass =
  "h-full min-h-0 max-h-[854px] contain-content overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl border bg-card p-4 shadow-xs";

const metadataValueMaxLength = 32;

const tabs: TabItem[] = [
  { id: "search", label: "搜索" },
  { id: "recommend", label: "推荐" },
  { id: "chat", label: "对话" }
];

export function ProjectPlayground() {
  const [configState, setConfigState] = useState<ConfigState>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<FeatureId>();
  const [query, setQuery] = useState("");
  const [searchImage, setSearchImage] = useState<SearchImage>();
  const [submittedSearch, setSubmittedSearch] = useState<SearchInput>();
  const [searchState, setSearchState] = useState<SearchState>(initialSearchState);
  const [queryRecommendationState, setQueryRecommendationState] =
    useState<QueryRecommendationState>(initialQueryRecommendationState);
  const [recommendState, setRecommendState] = useState<RecommendState>(
    initialRecommendState
  );
  const queryRecommendationRequestedRef = useRef(false);

  useEffect(() => {
    fetch("/api/config")
      .then(response => {
        if (!response.ok) throw new Error("Failed to load project config.");
        return response.json() as Promise<ConfigResponse>;
      })
      .then(data => {
        setConfigState({ status: "ready", data });
        setActiveTab(data.features[0]);
      })
      .catch(() => setConfigState({ status: "error" }));
  }, []);

  async function runSearch(searchInput: SearchInput, page: number) {
    const input = { ...searchInput, query: searchInput.query.trim() };
    if (!input.query && !input.image) {
      return;
    }

    setSubmittedSearch(input);
    setSearchState({ status: "loading" });
    try {
      const data = await postJson<SearchApiResponse>("/api/search", {
        query: input.query,
        image: input.image
          ? { base64: input.image.dataUrl }
          : undefined,
        page
      });
      setSearchState({ status: "ready", data });
    } catch (error) {
      setSearchState({ status: "error", error: getErrorMessage(error) });
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch({ query, image: searchImage }, 1);
  }

  function handleSearchPageChange(page: number) {
    void runSearch(submittedSearch ?? { query, image: searchImage }, page);
  }

  async function runQueryRecommendation() {
    setQueryRecommendationState(previous => ({
      status: "loading",
      data: getAsyncStateData(previous)
    }));
    try {
      const data = await postJson<QueryRecommendationResponse>("/api/query-recommendation");
      setQueryRecommendationState({ status: "ready", data });
    } catch (error) {
      setQueryRecommendationState(previous => ({
        status: "error",
        error: getErrorMessage(error),
        data: getAsyncStateData(previous)
      }));
    }
  }

  function handleQueryRecommendationSelect(keyword: string) {
    setQuery(keyword);
    setSearchImage(undefined);
    void runSearch({ query: keyword }, 1);
  }

  async function runRecommend() {
    setRecommendState({ status: "loading" });
    try {
      const data = await postJson<RecommendResponse>("/api/recommend");
      setRecommendState({ status: "ready", data });
    } catch (error) {
      setRecommendState({ status: "error", error: getErrorMessage(error) });
    }
  }

  function handleRefreshRecommend() {
    void runRecommend();
  }

  const features = configState.status === "ready" ? configState.data.features : [];
  const searchEnabled = configState.status === "ready" && features.includes("search");
  const recommendEnabled = features.includes("recommend");
  const availableTabs = tabs.filter(tab => features.includes(tab.id));
  const useFullHeightLayout = activeTab === "chat" || activeTab === "recommend";

  useEffect(() => {
    if (
      !searchEnabled ||
      activeTab !== "search" ||
      queryRecommendationRequestedRef.current
    ) {
      return;
    }
    queryRecommendationRequestedRef.current = true;
    void runQueryRecommendation();
  }, [activeTab, searchEnabled]);

  useEffect(() => {
    if (!recommendEnabled || activeTab !== "recommend") {
      return;
    }
    void runRecommend();
  }, [activeTab, recommendEnabled]);

  return (
    <main className="min-h-svh bg-background px-4 py-6 text-foreground sm:h-svh sm:overflow-hidden sm:px-8 sm:py-8">
      <div
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-160 flex-col gap-3",
          useFullHeightLayout && "min-h-[calc(100svh-3rem)] sm:h-full sm:min-h-0"
        )}
      >
        <header className="flex shrink-0 flex-col gap-1">
          <TypographyH1 className="text-left">Viking AI 搜索</TypographyH1>
          <TypographyMuted>
            为产品注入智能搜索、推荐与助手问答能力，提升体验与竞争力
          </TypographyMuted>
        </header>

        {configState.status === "loading" ? (
          <div className={tabContentFrameClass}>
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          </div>
        ) : configState.status === "error" ? (
          <div className={tabContentFrameClass}>
            <EmptyState
              title="能力配置暂不可用"
              description="能力配置加载失败，请稍后刷新重试。"
            />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as FeatureId)}
            className="min-h-0 flex-1 gap-5"
          >
            <TabsList variant="line">
              {availableTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {features.includes("search") ? (
              <TabsContent
                value="search"
                className={tabContentFrameClass}
              >
                <SearchPanel
                  query={query}
                  searchImage={searchImage}
                  searchState={searchState}
                  queryRecommendationState={queryRecommendationState}
                  onQueryChange={setQuery}
                  onImageChange={setSearchImage}
                  onSubmit={handleSearch}
                  onPageChange={handleSearchPageChange}
                  onRecommendationSelect={handleQueryRecommendationSelect}
                  onRecommendationRefresh={runQueryRecommendation}
                />
              </TabsContent>
            ) : null}

            {features.includes("recommend") ? (
              <TabsContent
                value="recommend"
                className={tabContentFrameClass}
              >
                <RecommendPanel
                  recommendState={recommendState}
                  onRefresh={handleRefreshRecommend}
                />
              </TabsContent>
            ) : null}

            {features.includes("chat") ? (
              <TabsContent
                value="chat"
                className={tabContentFrameClass}
              >
                <ChatPanel />
              </TabsContent>
            ) : null}
          </Tabs>
        )}
      </div>
    </main>
  );
}

function ChatPanel() {
  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string>();

  async function runChat(input: string) {
    const text = input.trim();
    if (!text || streaming) return;

    const assistantMessageId = createMessageId("assistant");
    setMessages(current => [
      ...current,
      {
        id: createMessageId("user"),
        role: "user",
        content: text,
        suggestions: [],
      },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        suggestions: [],
        pending: true
      }
    ]);
    setPrompt("");
    setError(undefined);
    setStreaming(true);

    try {
      await streamChat({
        message: text,
        sessionId,
        onSession: setSessionId,
        onChunk: chunk => {
          setMessages(current =>
            updateChatMessage(current, assistantMessageId, message =>
              mergeChatChunk(message, chunk)
            )
          );
        }
      });
      setMessages(current =>
        updateChatMessage(current, assistantMessageId, message => ({
          ...message,
          pending: false
        }))
      );
    } catch (chatError) {
      const message = getErrorMessage(chatError);
      setError(message);
      setMessages(current =>
        updateChatMessage(current, assistantMessageId, item => ({
          ...item,
          pending: false,
          error: message
        }))
      );
    } finally {
      setStreaming(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runChat(prompt);
  }

  function resetChat() {
    if (streaming) return;
    setSessionId(undefined);
    setMessages([]);
    setPrompt("");
    setError(undefined);
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex justify-end py-4">
        {messages.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            disabled={streaming}
            title="重置对话"
            onClick={resetChat}
          >
            <RefreshCwIcon data-icon="inline-start" />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <MessageScrollerProvider autoScroll scrollPreviousItemPeek={64}>
          <MessageScroller className="h-full">
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {messages.length > 0
                  ? messages.map(message => (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={message.role === "user"}
                      >
                        <ChatMessageRow message={message} />
                      </MessageScrollerItem>
                    ))
                  : (
                      <MessageScrollerItem
                        messageId="chat-empty"
                        className="flex flex-1 items-center justify-center"
                      >
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <MessageCircleIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                              开始新对话
                            </EmptyTitle>
                            <EmptyDescription>
                              发送一条消息后，回复会在这里实时出现。
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </MessageScrollerItem>
                    )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {error ? (
        <div className="pb-3">
          <ErrorAlert message={error} />
        </div>
      ) : null}

      <div className="bg-background">
        <form
          className="flex w-full items-center gap-2 rounded-3xl bg-muted p-2"
          onSubmit={handleSubmit}
        >
          <FieldGroup className="min-w-0 flex-1">
            <Field>
              <Textarea
                id="chat-message"
                className="max-h-28 min-h-10 resize-none border-0 bg-transparent px-2 py-2 leading-6 shadow-none disabled:bg-transparent disabled:opacity-100"
                disabled={streaming}
                placeholder="输入你想问的问题"
                rows={1}
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                onKeyDown={event => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </Field>
          </FieldGroup>
          <Button
            type="submit"
            size="icon"
            className="rounded-full"
            disabled={streaming || !prompt.trim()}
          >
            {streaming ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ArrowUpIcon data-icon="inline-start" />
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}

function ChatMessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const hasMetadata = message.suggestions.length > 0 || Boolean(message.error);

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          isUser
            ? "max-w-[78%] rounded-3xl bg-muted px-4 py-3 text-foreground"
            : "max-w-full px-1 text-foreground",
          message.error && "rounded-2xl border border-destructive/40 px-4 py-3"
        )}
      >
        {message.content && isUser ? (
          <TypographyP>
            {message.content}
          </TypographyP>
        ) : (
          <>
            {message.content ? (
              <MarkdownMessage content={message.content} />
            ) : message.pending ? (
              <TypographyMuted className="flex items-center gap-2">
                <Spinner data-icon="inline-start" />
                正在生成...
              </TypographyMuted>
            ) : (
              <TypographyMuted>暂无回复内容。</TypographyMuted>
            )}
          </>
        )}
        {hasMetadata ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map(suggestion => (
              <Badge key={suggestion} variant="secondary">
                {suggestion}
              </Badge>
            ))}
            {message.error ? <Badge variant="destructive">生成失败</Badge> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SearchPanel({
  query,
  searchImage,
  searchState,
  queryRecommendationState,
  onQueryChange,
  onImageChange,
  onSubmit,
  onPageChange,
  onRecommendationSelect,
  onRecommendationRefresh
}: {
  query: string;
  searchImage?: SearchImage;
  searchState: SearchState;
  queryRecommendationState: QueryRecommendationState;
  onQueryChange: Dispatch<SetStateAction<string>>;
  onImageChange: (image: SearchImage | undefined) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPageChange: (page: number) => void;
  onRecommendationSelect: (keyword: string) => void;
  onRecommendationRefresh: () => void;
}) {
  const items = searchState.status === "ready" ? searchState.data.search_results ?? [] : [];
  const page = searchState.status === "ready" ? searchState.data.page ?? 1 : 1;
  const totalPages = searchState.status === "ready" ? searchState.data.total_pages : undefined;
  const hasMore = searchState.status === "ready" ? Boolean(searchState.data.has_more) : false;
  const shouldShowPagination =
    searchState.status === "ready" &&
    items.length > 0 &&
    (page > 1 || hasMore || (typeof totalPages === "number" && totalPages > 1));
  const isLoading = searchState.status === "loading";

  return (
    <section className={cn("flex flex-col gap-4")}>
      <SearchForm
        query={query}
        image={searchImage}
        isLoading={isLoading}
        onQueryChange={onQueryChange}
        onImageChange={onImageChange}
        onSubmit={onSubmit}
      />
      <QueryRecommendationList
        state={queryRecommendationState}
        disabled={isLoading}
        onSelect={onRecommendationSelect}
        onRefresh={onRecommendationRefresh}
      />

      <ResultState
        state={searchState}
        emptyTitle="暂无搜索结果"
        emptyDescription="换个关键词再试。"
      />
      <ResultList items={items} total={searchState.status === "ready" ? searchState.data.total_items : undefined} />
      {shouldShowPagination ? (
        <SearchPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </section>
  );
}

function QueryRecommendationList({
  state,
  disabled,
  onSelect,
  onRefresh
}: {
  state: QueryRecommendationState;
  disabled: boolean;
  onSelect: (keyword: string) => void;
  onRefresh: () => void;
}) {
  const data = getAsyncStateData(state);
  const isLoading = state.status === "loading";
  const keywords = data ? getQueryRecommendationKeywords(data) : [];
  const hasKeywords = keywords.length > 0;

  if (isLoading && !hasKeywords) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    );
  }

  if (!hasKeywords) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <TypographySmall>猜你想搜</TypographySmall>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled || isLoading}
          title={isLoading ? "正在换一批" : "换一批"}
          onClick={onRefresh}
        >
          <RefreshCwIcon className={cn(isLoading && "animate-spin")} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map(keyword => (
          <Button
            key={keyword}
            type="button"
            variant="outline"
            size="sm"
            className="max-w-full justify-start"
            disabled={disabled}
            onClick={() => onSelect(keyword)}
          >
            <SearchIcon data-icon="inline-start" />
            <span className="min-w-0 truncate">{keyword}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function SearchForm({
  query,
  image,
  isLoading,
  onQueryChange,
  onImageChange,
  onSubmit
}: {
  query: string;
  image?: SearchImage;
  isLoading: boolean;
  onQueryChange: Dispatch<SetStateAction<string>>;
  onImageChange: (image: SearchImage | undefined) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isSubmitDisabled = isLoading || (!query.trim() && !image);

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const file = getClipboardImageFile(event.clipboardData);
    if (!file) return;

    event.preventDefault();
    void readSearchImage(file).then(onImageChange);
  }

  function handleRemoveImage() {
    onImageChange(undefined);
  }

  return (
    <form className="mx-auto flex w-full max-w-3xl items-center gap-3" onSubmit={onSubmit}>
      <FieldGroup className="flex-1">
        <Field className="relative">
          <Input
            id="search-query"
            className={cn("h-12 px-4 text-base md:text-base", image && "pl-14")}
            placeholder="请输入关键词或粘贴图片"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            onPaste={handlePaste}
          />
          {image ? <SearchImageChip image={image} onRemove={handleRemoveImage} /> : null}
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        size="icon"
        className="size-12"
        disabled={isSubmitDisabled}
      >
        {isLoading ? <Spinner /> : <SearchIcon />}
      </Button>
    </form>
  );
}

function SearchImageChip({
  image,
  onRemove
}: {
  image: SearchImage;
  onRemove: () => void;
}) {
  return (
    <div className="absolute left-2 top-1/2 size-8 -translate-y-1/2">
      <div className="relative size-8">
        <img
          className="size-8 rounded-md border object-cover shadow-sm"
          src={image.dataUrl}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="absolute -right-1.5 -top-1.5 size-4 rounded-full bg-background/95 p-0 shadow-sm [&_svg:not([class*='size-'])]:size-2.5"
          title="移除图片"
          onClick={onRemove}
        >
          <XIcon data-icon="inline-start" />
        </Button>
      </div>
    </div>
  );
}

function RecommendPanel({
  recommendState,
  onRefresh
}: {
  recommendState: RecommendState;
  onRefresh: () => void;
}) {
  const items = recommendState.status === "ready" ? recommendState.data.rec_results ?? [] : [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={recommendState.status === "loading"}
          title="重新推荐"
          onClick={onRefresh}
        >
          {recommendState.status === "loading" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RefreshCwIcon data-icon="inline-start" />
          )}
          重新推荐
        </Button>
      </div>
      <ResultState
        state={recommendState}
        emptyTitle="暂无推荐结果"
        emptyDescription="稍后刷新再试。"
      />
      <ResultList items={items} resultLabel="条推荐结果" />
    </section>
  );
}

function ResultState({
  state,
  emptyTitle,
  emptyDescription
}: {
  state: SearchState | RecommendState;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (state.status === "loading") return <ResultSkeleton />;
  if (state.status === "error") return <ErrorAlert message={state.error} />;
  if (state.status !== "ready") return null;

  const items = getResultItems(state.data);
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return null;
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>请求失败</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
    </Empty>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function ResultList({
  items,
  total,
  resultLabel = "条结果"
}: {
  items: ResultItemData[];
  total?: number;
  resultLabel?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <TypographyMuted>
        已显示 {items.length}
        {Number.isFinite(total) ? ` / ${total}` : ""} {resultLabel}
      </TypographyMuted>
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => {
          const result = normalizeResultItem(item, index);
          return <ResultItem item={result} key={result.key} />;
        })}
      </ol>
    </div>
  );
}

function ResultItem({ item }: { item: NormalizedResult }) {
  return (
    <li>
      <Card size="sm">
        <CardHeader>
          <div className="flex min-w-0 gap-4">
            {item.imageUrl ? (
              <img
                className="size-20 shrink-0 rounded-md border object-cover"
                src={item.imageUrl}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <CardTitle className="truncate">{item.title}</CardTitle>
              {item.description ? (
                <CardDescription className="line-clamp-2">
                  {item.description}
                </CardDescription>
              ) : null}
            </div>
          </div>
        </CardHeader>
        {item.metadata.length > 0 ? (
          <CardContent>
            <TypographyMuted>{item.metadata.join(" · ")}</TypographyMuted>
          </CardContent>
        ) : null}
      </Card>
    </li>
  );
}

function SearchPagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getPaginationItems(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === page}
                onClick={event => {
                  event.preventDefault();
                  if (item !== page) onPageChange(item);
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}
      </PaginationContent>
    </Pagination>
  );
}

function getPaginationItems(page: number, totalPages?: number): Array<number | "ellipsis"> {
  if (!totalPages) return [page];
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
  if (page >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

function getAsyncStateData<TData>(state: AsyncState<TData>): TData | undefined {
  return "data" in state ? state.data : undefined;
}

function getQueryRecommendationKeywords(data: QueryRecommendationResponse): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const item of data.recommendation_queries ?? []) {
    const keyword = item.query?.trim();
    if (!keyword || seen.has(keyword)) continue;
    seen.add(keyword);
    keywords.push(keyword);
  }

  return keywords;
}

function getClipboardImageFile(data: DataTransfer): File | undefined {
  return Array.from(data.items).find(item => {
    return item.kind === "file" && item.type.startsWith("image/");
  })?.getAsFile() ?? undefined;
}

function readSearchImage(file: File): Promise<SearchImage> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  });
}

function updateChatMessage(
  messages: ChatMessage[],
  messageId: string,
  update: (message: ChatMessage) => ChatMessage
): ChatMessage[] {
  return messages.map(message => (message.id === messageId ? update(message) : message));
}

function mergeChatChunk(message: ChatMessage, chunk: ChatSearchChunk): ChatMessage {
  return {
    ...message,
    content:
      typeof chunk.content === "string" ? `${message.content}${chunk.content}` : message.content,
    suggestions: mergeUniqueStrings(message.suggestions, readChunkSuggestions(chunk))
  };
}

function readChunkSuggestions(chunk: ChatSearchChunk): string[] {
  const suggestions = chunk.payload?.suggestions;
  return Array.isArray(suggestions)
    ? suggestions.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
}

function mergeUniqueStrings(current: string[], next: string[]): string[] {
  const values = new Set(current);
  for (const value of next) values.add(value);
  return [...values];
}

function createMessageId(prefix: ChatMessageRole): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeResultItem(item: ResultItemData, index: number): NormalizedResult {
  const source = getResultSource(item);
  const fields = Object.entries(source)
    .map(([key, value]) => ({ key, value: readText(value) }))
    .filter((field): field is { key: string; value: string } => Boolean(field.value));
  const id = readText(item._id);
  const image = pickImage(source);
  const title = pickTitle(source, id);
  const usedKeys = new Set([image?.key, title.key].filter(Boolean));
  const description = pickDescription(fields, usedKeys);
  if (description) usedKeys.add(description.key);

  return {
    key: id ?? `${title}-${index}`,
    title: truncateText(title.value, 96),
    description: description ? truncateText(description.value, 180) : undefined,
    imageUrl: image?.value,
    metadata: pickMetadata(fields, usedKeys)
  };
}

function getResultSource(item: ResultItemData): Record<string, unknown> {
  if (isRecord(item.display_fields)) return item.display_fields;
  return isRecord(item) ? item : {};
}

function pickImage(source: Record<string, unknown>) {
  for (const [key, value] of Object.entries(source)) {
    const imageUrl = readImageUrl(value);
    if (imageUrl) return { key, value: imageUrl };
  }
  return undefined;
}

function pickTitle(source: Record<string, unknown>, id?: string) {
  for (const key of titleFields) {
    const value = readText(source[key]);
    if (value) return { key, value };
  }
  return { key: "_id", value: id ?? "未命名结果" };
}

function pickDescription(
  fields: Array<{ key: string; value: string }>,
  usedKeys: Set<string | undefined>
) {
  return fields
    .filter(field => {
      return (
        !usedKeys.has(field.key) &&
        field.value.length > 12 &&
        !isUrl(field.value)
      );
    })
    .sort((a, b) => b.value.length - a.value.length)[0];
}

function pickMetadata(
  fields: Array<{ key: string; value: string }>,
  usedKeys: Set<string | undefined>
): string[] {
  return fields
    .filter(field => {
      return (
        !usedKeys.has(field.key) &&
        field.value.length <= 80 &&
        !isUrl(field.value)
      );
    })
    .slice(0, 4)
    .map(field => `${field.key} ${truncateText(field.value, metadataValueMaxLength)}`);
}

function readText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map(part => (typeof part === "string" || typeof part === "number" ? String(part).trim() : ""))
      .filter(Boolean);
    return parts.length > 0 ? parts.join("、") : undefined;
  }

  return undefined;
}

function readImageUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value
      .trim()
      .match(/https?:\/\/[^\s"'<>，、,]+?\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>，、,]*)?/i)?.[0];
  }

  const values = Array.isArray(value) ? value : isRecord(value) ? Object.values(value) : [];
  for (const item of values) {
    const imageUrl = readImageUrl(item);
    if (imageUrl) return imageUrl;
  }
  return undefined;
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function getResultItems(data: SearchApiResponse | RecommendResponse): ResultItemData[] {
  if (isRecommendResponse(data)) return data.rec_results ?? [];
  return data.search_results ?? [];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请求失败。";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRecommendResponse(
  data: SearchApiResponse | RecommendResponse
): data is RecommendResponse {
  return "rec_results" in data;
}
