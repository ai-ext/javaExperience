// 번호가 바뀌어도 예전 인사 API의 완료를 게시판 완료로 바꾸지 않는다.
// v1 원본 저장 키는 삭제하지 않고 v2에 새 번호로 복사한다.
export function migrateLegacyProgress(saved) {
  if(!Array.isArray(saved)) return [];
  return [...new Set(saved.filter(n=>Number.isInteger(n)&&n>=5&&n<=60).map(n=>n<=57?n-4:n))];
}
