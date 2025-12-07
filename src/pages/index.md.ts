import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const markdownContent = `# Luke Dunshea (@elldeeone)

Building with AI, one prompt at a time. Thoughts on codegen, crypto, and technology.

## Navigation

- [About](/about.md)
- [Recent Posts](/posts.md)
- [Archives](/archives.md)
- [RSS Feed](/rss.xml)

## Links

- Twitter: [@elldeeone](https://twitter.com/elldeeone)
- GitHub: [@elldeeone](https://github.com/elldeeone)
- LinkedIn: [lukedunshea](https://linkedin.com/in/lukedunshea)

---

*This is the markdown-only version of dunshea.au. Visit [dunshea.au](https://dunshea.au) for the full experience.*`;

  return new Response(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
