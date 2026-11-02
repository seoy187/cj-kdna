# 유료 LLM API 없이 프로토타입 챗봇 만들기

결론: 가능하다. 다만 비용이 사라지는 대신 사용 한도, 내 컴퓨터 사양, 답변 품질 중 하나를 감수해야 한다.

> 서비스별 무료 한도와 약관은 자주 바뀐다. 이 노트는 최신 공식 문서를 대조하지 않고 작성했으므로, 쓰기 전에 공식 문서를 확인한다.

## 방법 비교

| 방법 | 예시 | 비용 | 장점 | 한계 | 어울리는 상황 |
| --- | --- | --- | --- | --- | --- |
| 무료 등급 클라우드 API | Google AI Studio(Gemini), Groq, OpenRouter의 무료 모델, Cloudflare Workers AI | 한도 안에서 무료 | 구현이 유료 API와 거의 같고, 배포해서 남에게 보여주기 쉽다 | 호출 한도가 있고, 무료 등급 입력이 모델 개선에 쓰일 수 있다 | 다른 사람도 써봐야 하는 데모 |
| 내 컴퓨터에서 모델 실행 | Ollama, LM Studio, llama.cpp + 공개 모델(Llama, Qwen, Gemma 등) | 전기료 외 없음 | 토큰 비용과 한도가 없고, 데이터가 밖으로 나가지 않는다 | 사양에 따라 느리고, 내 컴퓨터가 켜져 있어야 한다 | 혼자 개발, 내부 시연 |
| 브라우저에서 모델 실행 | WebLLM, Transformers.js | 없음 | 서버가 필요 없다 | 첫 모델 다운로드가 크고, WebGPU와 사용자 기기 사양에 좌우된다. 작은 모델만 현실적이다 | 정적 사이트, 간단한 기능 |
| LLM 없이 구현 | 규칙 · 시나리오 트리, FAQ + 임베딩 검색 | 없음 | 답변을 통제할 수 있고 빠르다 | 준비된 범위 밖의 질문에 답하지 못한다 | 질문 범위가 좁은 FAQ, 안내 봇 |

## 고르는 기준

1. 질문 범위가 좁으면 LLM 없이 FAQ + 검색으로 충분한지 먼저 본다.
2. 다른 사람이 링크로 접속해야 하면 무료 등급 클라우드 API를 쓴다.
3. 혼자 개발하거나 내 노트북으로 시연하면 Ollama를 쓴다.

## 구현 팁

- Ollama, LM Studio, Groq, OpenRouter 등은 OpenAI 호환 API를 제공한다. `base_url`과 모델명만 바꾸면 되므로, 처음부터 이 둘을 환경 변수로 빼 둔다.
- 개발은 Ollama로, 시연은 무료 API로 나누면 무료 한도를 아낄 수 있다.
- 무료 API 키도 프론트엔드 코드에 넣지 않고 서버(또는 서버리스 함수)를 거쳐 호출한다.
- 무료 등급에는 민감한 데이터를 넣지 않는다.
- 한도 초과(HTTP 429) 때 보여줄 안내 문구를 준비해 둔다.

```python
# 환경 변수만 바꾸면 Ollama와 클라우드 API를 오갈 수 있다
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.getenv("LLM_BASE_URL", "http://localhost:11434/v1"),  # 기본값은 Ollama
    api_key=os.getenv("LLM_API_KEY", "ollama"),  # Ollama는 키 값을 검사하지 않는다
)

reply = client.chat.completions.create(
    model=os.getenv("LLM_MODEL", "llama3.2"),
    messages=[{"role": "user", "content": "안녕"}],
)
print(reply.choices[0].message.content)
```
