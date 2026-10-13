import Worksheet from "../components/Worksheet";

export default function Page() {
  return (
    <main>
      <p className="muted">sprskit.com</p>
      <h1>SPRS score worksheet</h1>
      <p>
        Enter how many NIST SP 800-171 requirements you are treating as not
        implemented, split by the point values in the public DoD Assessment
        Methodology. This page computes <code>110 − (5 × a) − (3 × b) − c</code> and,
        when that total is below −203, shows the published floor of −203.
      </p>
      <p>
        It does not decide which requirements are worth 5, 3, or 1 point. It does
        not apply temporary-deficiency deductions or Plan of Action and Milestones
        credits. It does not store what you type.
      </p>
      <Worksheet />
      <section className="limits">
        <h2>What this is not</h2>
        <p>
          This is not an official SPRS submission, not a CMMC assessment, and not
          legal or contracting advice. A supplier still has to use the current DoD
          methodology and their own system security plan.
        </p>
        <p>
          The paid NIST 800-171 self-assessment kit is a different product at{" "}
          <a href="https://sprs.sh">sprs.sh</a>. This site does not sell that kit
          and does not change its price.
        </p>
      </section>
    </main>
  );
}
