import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML layout for Web static rendering & Web builds in Expo Router.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no" />
        
        {/* SEO & Web Title */}
        <title>BodyFit - Sức Mạnh Việt | Chăm Sóc Sức Khỏe & Tập Luyện</title>
        <meta name="description" content="BodyFit - Ứng dụng theo dõi dinh dưỡng, tính toán calo và trợ lý huấn luyện viên tập luyện thông minh dành cho người Việt." />
        <meta name="theme-color" content="#100E0C" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        {/* ScrollView CSS reset for Expo Web */}
        <ScrollViewStyleReset />

        {/* Custom Web Aesthetics & Layout CSS */}
        <style dangerouslySetInnerHTML={{ __html: responsiveWebStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveWebStyles = `
/* Web Reset & High-end Dark Theme Styling */
html, body {
  background-color: #0A0907;
  color: #FFF8E7;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  display: flex;
  height: 100%;
  width: 100%;
  background: radial-gradient(circle at 50% 30%, rgba(255, 159, 28, 0.12) 0%, rgba(16, 14, 12, 1) 75%);
}

/* Custom Sleek Web Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(16, 14, 12, 0.9);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 159, 28, 0.35);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 159, 28, 0.7);
}

/* Disable blinking cursor caret & text selection artifacts on all non-input elements */
*:not(input):not(textarea):not([contenteditable="true"]) {
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}

/* Allow text selection ONLY in text input controls */
input, textarea, [contenteditable="true"] {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
  cursor: text !important;
}

/* Remove default focus outline and caret artifacts on non-inputs */
*:not(input):not(textarea):not([contenteditable="true"]):focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Ensure all clickable items display cursor pointer and react immediately to clicks */
button, [role="button"], a, [tabindex], [data-focusable="true"], [onclick] {
  user-select: none !important;
  -webkit-user-select: none !important;
  cursor: pointer !important;
}
`;
