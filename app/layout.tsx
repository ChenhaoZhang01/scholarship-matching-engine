import type { ReactNode } from "react";

export const metadata = {
  title: "Scholarship Matching Engine",
  description: "Match students to scholarships by eligibility and fit",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0d1117", color: "#e6edf3", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
