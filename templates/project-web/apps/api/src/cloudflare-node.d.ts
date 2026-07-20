declare module "cloudflare:node" {
  export function httpServerHandler(options: { port: number }): unknown;
}
