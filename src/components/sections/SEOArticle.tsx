export default function SEOArticle() {
  return (
    <section id="guide" className="scroll-mt-24 border-t border-slate-200 pt-12">
      <article className="max-w-3xl space-y-5">
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Free Online File Tools That Respect Your Privacy
        </h2>

        <p className="text-sm leading-relaxed text-slate-700">
          AHADEX Tools is a collection of browser-based file utilities designed to help you compress
          and resize images or optimize, merge, and split PDF documents without uploading private
          files to remote servers. Every published utility runs directly inside your browser using
          modern Web APIs, Canvas rendering, Web Workers, and local PDF object processing so your
          files stay on your own hardware.
        </p>

        <h3 className="pt-2 font-display text-lg font-semibold text-slate-900">
          What Makes Browser-Based Processing Different?
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">
          Traditional online converters require uploading each file to an external backend server,
          waiting in a processing queue, and downloading the output again. That creates both a
          privacy exposure—because sensitive receipts, contracts, or personal photos leave your
          device—and unnecessary latency on slower connections.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          Client-side processing eliminates server transfer entirely. You can inspect your browser
          network tab while compressing or resizing images and verify that zero file bytes are
          transmitted over the network. Processing starts immediately using your own CPU and memory.
        </p>

        <h3 className="pt-2 font-display text-lg font-semibold text-slate-900">
          Who Benefits Most from Local Browser Tools?
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">
          Web developers optimizing asset payloads for Core Web Vitals, students preparing images
          for online submissions, small business owners handling internal graphics, and anyone
          working on mobile or constrained bandwidth benefit from instant local execution with no
          account creation or subscription locks.
        </p>

        <h3 className="pt-2 font-display text-lg font-semibold text-slate-900">
          Transparent Limitations
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">
          Because all computation happens inside your browser tab, maximum file capacity depends on
          your device RAM and browser support. For typical web images and everyday documents,
          client-side processing is fast and reliable without risking external data exposure.
        </p>
      </article>
    </section>
  );
}
