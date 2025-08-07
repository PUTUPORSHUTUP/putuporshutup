const Footer = () => {
  return (
    <div className="w-full bg-neutral-950 text-neutral-300 text-xs py-4 px-6 border-t border-neutral-800 mt-10">
      <p className="mb-1 font-semibold">📣 Transparency Notice</p>
      <p>
        Stripe has closed our previous payment processing account (acct_1RjNB2JP1hmAsdKO)
        due to policy restrictions involving skill-based platforms. PUOSU is a
        competitive challenge system — not gambling — and we've fully transitioned to a
        wallet-based model with third-party processors. View Stripe's
        <a
          href="https://stripe.com/restricted-businesses"
          className="underline ml-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          restricted businesses list
        </a>
        for reference.
      </p>
    </div>
  );
};

export default Footer;