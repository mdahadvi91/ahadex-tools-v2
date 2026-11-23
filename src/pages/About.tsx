export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        About AHADEX Tools
      </h1>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          AHADEX Tools is a collection of free, browser-based file utilities built with one
          principle in mind: <strong>your files should never leave your device</strong>.
        </p>

        <p>
          Most online tools work by uploading your file to a remote server, processing it there, and
          sending it back. This approach has real privacy implications — you have no way to verify
          what happens to your file on someone else's server. AHADEX takes a different approach:
          every tool runs entirely in your browser using modern JavaScript APIs. Your files are
          processed locally, on your own device, and never transmitted anywhere.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Why We Built This</h2>
        <p>
          We were frustrated with existing online tools that required signups, limited free usage,
          and uploaded files to unknown servers. We wanted to prove that useful tools could exist
          without compromising privacy or charging users.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">How It Works</h2>
        <p>
          When you use an AHADEX tool, your browser performs all the processing. For image
          compression, we use the browser's built-in Canvas API and modern compression algorithms.
          For PDF manipulation, we use WebAssembly-based PDF libraries that run entirely in your
          browser. No servers are involved in file processing.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">What We Don't Do</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>We don't upload your files to any server</li>
          <li>We don't store your files or their metadata</li>
          <li>We don't require signup or personal information</li>
          <li>We don't add watermarks or limit free usage</li>
          <li>We don't sell or share any user data</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
        <p>
          Questions, feedback, or issues? Reach out via our{' '}
          <a href="/contact" className="text-slate-900 underline hover:text-slate-700">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
