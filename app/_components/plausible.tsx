import Script from "next/script";

export default function Plausible() {
  return (
    <>
      <Script
        data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMIAN}
        src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC}
      />
    </>
  );
}
