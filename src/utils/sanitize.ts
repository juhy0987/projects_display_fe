// -- HTML Sanitizer ----------------------------------------------------------
//
// 기존 바닐라 JS 의 sanitizeHtml() allowlist 정책을 DOMPurify 로 구현한다.
// formatted_text 를 dangerouslySetInnerHTML 로 주입하기 전에 반드시 이 함수를
// 거쳐야 저장형 XSS 를 방지할 수 있다.
// (Ref: https://github.com/cure53/DOMPurify#readme)

import DOMPurify from "dompurify";

// 기존 formattingToolbar.js 의 sanitizeHtml 과 동일한 허용 태그/속성
const ALLOWED_TAGS = [
  "b", "strong", "i", "em", "u", "s", "strike", "code",
  "a", "br", "span", "p", "div",
];

const ALLOWED_ATTR = ["href", "target", "rel", "style", "class"];

/** HTML 문자열을 안전한 허용 태그/속성만 남기고 정제한다. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
