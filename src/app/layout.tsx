import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'MWTSI Address Intelligence | Hybrid Address Remediation',description:'Local address enrichment, deterministic hybrid transformation and evidence-led review.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
