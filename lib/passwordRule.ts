/**
 * 관리자 비밀번호 작성 규칙 — 서버(app/api/admin-password)와 관리자 화면이 함께 쓴다.
 *
 * 「개인정보의 안전성 확보조치 기준」의 안전한 비밀번호 작성규칙을 따른다.
 * 해설서가 예시로 드는 기준과 같다.
 *   - 영문 대문자·영문 소문자·숫자·특수문자 중 2종류 이상 조합 → 10자 이상
 *   - 3종류 이상 조합 → 8자 이상
 */

export const PASSWORD_RULE_HINT = "영문·숫자·특수문자 중 2종류 이상 10자 이상, 또는 3종류 이상 8자 이상";

/** 규칙을 어기면 사용자에게 보여줄 문구를, 통과하면 null을 돌려준다 */
export function passwordRuleError(password: string): string | null {
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (kinds >= 3 && password.length >= 8) return null;
  if (kinds >= 2 && password.length >= 10) return null;
  return `새 비밀번호는 ${PASSWORD_RULE_HINT}로 만들어 주세요.`;
}
