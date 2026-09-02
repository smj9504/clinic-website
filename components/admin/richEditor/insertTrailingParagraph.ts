import type { CommandProps } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

/**
 * atom 블록(이미지, 가로 배치) 삽입 직후 커맨드 체인에 이어붙이는 TipTap
 * command. setImage/insertContent가 방금 삽입한 노드를 선택 상태
 * (NodeSelection)로 남겨두면, 바로 이어서 같은 삽입을 한 번 더 실행할 때
 * 새 노드가 뒤에 추가되는 대신 그 선택을 "교체"해버린다. 삽입 뒤에 빈
 * 문단을 끼워 넣고 커서를 그 안으로 옮겨 텍스트 커서로 되돌린다. command()
 * 콜백 안에서 tr을 읽어야 직전 삽입이 만든 트랜잭션 이후의 실제 위치를 얻는다.
 */
export function insertTrailingParagraph({ tr, dispatch }: CommandProps) {
  if (dispatch) {
    const pos = tr.selection.to;
    tr.insert(pos, tr.doc.type.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, pos + 1));
  }
  return true;
}
