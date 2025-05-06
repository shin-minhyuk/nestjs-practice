## 학습 중 자주 발생한 실수들

### 1. 비동기 처리 누락 (await 키워드 누락)

- **문제**: Repository 메서드 호출 시 await 키워드를 누락하여 if문을 무시하고 무조건 200번을 반환하여 디버깅이 불가능하던 이슈
- **예시**: `const genre = this.genreRepository.findOne()` (X) → `const genre = await this.genreRepository.findOne()` (O)
- **결과**: 존재하지 않는 리소스에 대해서도 예외를 발생시키지 않고 성공 응답(200)을 반환
- **해결**: 모든 비동기 메서드 호출 앞에 await 키워드 추가
