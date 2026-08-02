judge.mjs의 styleTouched 판정에만 쓰이는 기준 파일이다 (`SEED/src/App.css` 한 개).
시드 전체(142MB)는 필요 없다 — exp3의 런 디렉터리는 exp/todo-b2t*·exp2/todo-d* 사본에서 시작하므로
시드에서 복사되지 않는다. 이 파일이 없으면 judge가 ABSENT와 비교해 styleTouched를 오탐한다(실측).
