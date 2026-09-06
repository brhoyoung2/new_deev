# VTuber Companion 기술 선택지와 Live2D 자료

## 1. 현재 선택한 구성

현재 프로젝트는 다음 조합으로 구현되어 있다.

- UI와 앱 로직: TypeScript, HTML, CSS
- 빌드 도구: Vite
- 캐릭터: Live2D Cubism SDK for Web
- 모바일 패키징: Capacitor
- 우선 플랫폼: Android
- 음성 인식: `@capacitor-community/speech-recognition`
- 기기 TTS: `@capacitor-community/text-to-speech`
- 캐릭터 음성: VOICEVOX Web API

이 조합을 선택한 가장 큰 이유는 화면과 기능 대부분을 텍스트 기반 소스코드로 관리할 수 있기 때문이다. Unity처럼 에디터에서 씬과 프리팹을 수동으로 연결하는 작업이 적어 AI 코딩 도구를 활용하기 쉽다.

## 2. 개발 방식별 경우의 수

### Live2D Web SDK + Capacitor

장점:

- 현재 사용 중인 방식
- Android와 iOS에서 웹 코드를 공유
- UI, 터치, API, 상태 관리를 TypeScript로 구현
- 변경 사항을 코드 리뷰하기 쉬움
- 웹 개발 도구와 라이브러리를 그대로 사용
- AI 코딩 도구가 프로젝트 대부분을 수정 가능

단점:

- WebView와 WebGL 오버헤드가 있음
- 네이티브 SDK보다 메모리 및 프레임 제어가 제한적
- 고급 오디오 처리나 결제 기능은 Capacitor 플러그인이 필요
- 플러그인 버전과 Capacitor 버전 호환성을 관리해야 함

추천 상황:

- Live2D 중심의 2D 캐릭터 앱
- 빠른 MVP 제작
- 코드 기반 개발을 선호할 때
- Android와 iOS를 하나의 UI 코드로 운영할 때

### Unity + Live2D Cubism SDK for Unity

장점:

- Live2D 공식 지원과 풍부한 예제
- 애니메이션, 파티클, 카메라 연출에 강함
- 복잡한 캐릭터 상호작용과 미니게임 추가에 유리
- Android와 iOS 빌드 지원
- 에셋 스토어와 게임 개발 도구 활용 가능

단점:

- 씬, 프리팹, 인스펙터 연결 등 GUI 작업이 많음
- 프로젝트 파일 변경만으로 모든 작업을 자동화하기 어려움
- 앱 크기와 메모리 사용량이 커질 수 있음
- 단순 대화형 앱에는 구조가 무거울 수 있음

추천 상황:

- 게임 요소가 핵심일 때
- 복잡한 이펙트와 연출이 필요할 때
- 개발자가 Unity 에디터 작업을 직접 수행할 수 있을 때

### Android 네이티브 + Live2D Cubism SDK for Native

구성 예:

- Kotlin 또는 Java
- Android View, Compose 또는 OpenGL ES
- Cubism SDK for Native

장점:

- Android에서 가장 직접적인 성능 제어
- 마이크, 오디오, 알림, 결제 등 네이티브 API 사용이 편리
- WebView 의존성이 없음
- 앱 수명주기와 백그라운드 처리가 명확함

단점:

- Live2D 렌더러와 Android UI를 직접 연결하는 난도가 높음
- iOS용 코드를 별도로 작성해야 함
- C++ 빌드와 NDK 설정이 필요할 수 있음
- 개발 속도가 Web + Capacitor보다 느림

추천 상황:

- Android 전용 고성능 제품
- 장시간 실행과 낮은 지연시간이 중요할 때
- 네이티브 개발 경험이 충분할 때

### iOS 네이티브 + Live2D Cubism SDK for Native

구성 예:

- Swift와 SwiftUI 또는 UIKit
- Metal 또는 OpenGL 계층
- Cubism SDK for Native

장점:

- iPhone 하드웨어와 오디오 기능을 직접 활용
- 네이티브 UI와 접근성 지원
- 성능과 메모리 제어에 유리

단점:

- Mac과 실제 iPhone 테스트가 필요
- Android 코드와 공유되는 부분이 적음
- 앱 서명과 Apple 개발자 계정 설정 필요
- Live2D 렌더링 통합 난도가 높음

추천 상황:

- iOS가 주력 플랫폼일 때
- Apple 기능과 깊은 통합이 필요할 때

### Flutter

장점:

- Android와 iOS UI 코드 공유
- 선언형 UI와 빠른 화면 개발
- 일반 앱 화면과 상태 관리가 편리

단점:

- Live2D 공식 Flutter SDK가 없음
- WebView로 Web SDK를 넣거나 네이티브 플러그인을 직접 작성해야 함
- 결국 플랫폼 채널, C++ 또는 WebView 계층이 추가됨
- Live2D 렌더링 문제를 진단하기 복잡해질 수 있음

추천 상황:

- 일반적인 앱 화면 비중이 매우 크고 Live2D는 일부 화면에만 있을 때
- Flutter 전문 개발자가 커스텀 플러그인을 관리할 수 있을 때

현재 프로젝트에는 Capacitor보다 특별한 이점이 적다.

### React Native

장점:

- JavaScript 또는 TypeScript 사용
- Android와 iOS UI 코드 공유
- 네이티브 모듈 연동 가능

단점:

- Live2D 공식 React Native SDK가 없음
- WebView 또는 네이티브 브리지 구현 필요
- 렌더링과 앱 UI 사이의 생명주기 관리가 복잡

추천 상황:

- 기존 React Native 앱에 Live2D 기능을 추가할 때

새 프로젝트라면 Live2D Web + Capacitor가 더 단순하다.

### Godot

장점:

- 오픈소스 게임 엔진
- 2D 게임과 상호작용 구현에 적합
- Unity보다 가벼운 편

단점:

- Live2D 공식 Godot SDK가 없음
- 커뮤니티 플러그인 또는 직접 통합 필요
- 플러그인 유지보수와 모바일 호환성 위험

추천 상황:

- 오픈소스 게임 엔진이 필수이고 직접 렌더러를 관리할 수 있을 때

## 3. Live2D 사용 방식

### Cubism SDK for Web

- 브라우저와 WebView에서 WebGL로 렌더링
- JavaScript 및 TypeScript 앱에 적합
- 현재 프로젝트에서 사용 중
- Capacitor, Electron 및 일반 웹사이트에 적용 가능

### Cubism SDK for Unity

- Unity 프로젝트용 공식 SDK
- 게임과 실시간 연출에 적합
- Unity 에디터 작업이 필요

### Cubism SDK for Native

- C++ 기반
- OpenGL, Metal, DirectX 등 플랫폼 렌더링 계층과 연결
- 최고 수준의 제어가 가능하지만 통합 난도가 높음

### Cubism SDK for Java

- Java 환경을 위한 선택지
- Android 통합 시 검토 가능
- 프로젝트 요구 버전과 지원 범위를 공식 문서에서 확인해야 함

### 커뮤니티 렌더러

예:

- PixiJS 기반 Live2D 플러그인
- 다양한 비공식 WebGL 래퍼

장점:

- 공식 샘플보다 API가 간단할 수 있음
- 일반 웹 그래픽 엔진과 결합하기 쉬움

주의점:

- 최신 Cubism Core와의 호환성 확인 필요
- 모델 버전, 마스크, 블렌드 모드 지원 차이가 있음
- 앱 배포 시 공식 SDK 라이선스와 플러그인 라이선스를 모두 확인

## 4. Live2D 모델 파일 구성

일반적인 런타임 모델에는 다음 파일이 포함된다.

- `.model3.json`: 모델 구성과 참조 파일 목록
- `.moc3`: 컴파일된 모델
- `.png`: 텍스처
- `.physics3.json`: 머리카락과 의상 등의 물리효과
- `.motion3.json`: 대기 및 터치 모션
- `.exp3.json`: 표정
- `.pose3.json`: 파츠 전환과 자세
- `.cdi3.json`: 파라미터 및 파츠 표시 정보
- 음원 파일: 모션에 연결된 음성 또는 효과음

`.cmo3`는 Cubism Editor에서 편집하기 위한 원본 파일이다. 앱 실행에는 보통 내보낸 `.moc3`와 JSON, 텍스처 파일이 필요하다.

VTube Studio용 모델은 기본 런타임 파일을 포함하는 경우가 많지만, VTube Studio 전용 설정과 단축키가 우리 앱에서 자동으로 동작하는 것은 아니다. 필요한 표정과 모션을 앱 코드에 직접 연결해야 한다.

## 5. 모델을 구할 수 있는 곳

### Live2D 공식 샘플

- https://www.live2d.com/en/learn/sample/
- 개발과 학습에 적합
- 모델별 이용 약관 확인 필요

### BOOTH

- https://booth.pm/
- 무료 및 유료 Live2D 모델 다수
- 다운로드에 계정이 필요한 경우가 있음
- 제작자별 개인 사용, 상업 사용, R-18, 재배포 조건이 다름

### nizima

- https://nizima.com/
- Live2D 공식 마켓
- 완성 모델, 일러스트 및 제작 의뢰 검색 가능

### itch.io

- https://itch.io/game-assets/tag-live2d
- 무료 또는 원하는 가격을 지불하는 모델이 있음
- 파일 구성과 라이선스 품질 차이가 큼

### 현재 사용 모델

- Pachan: https://booth.pm/en/items/4711410
- 상반신 모델
- `.moc3`, 텍스처, 물리효과 포함
- 별도 표정과 터치 모션은 포함되지 않음

## 6. 모델 선정 체크리스트

- 캐릭터가 명확한 성인으로 표현되는가
- 앱 포함 및 개인·상업 사용이 허용되는가
- APK에 모델 파일을 포함할 수 있는가
- 원작자와 리거 크레딧 조건은 무엇인가
- 재배포 금지 조건이 앱 배포와 충돌하지 않는가
- R-18 사용이 필요하다면 명시적으로 허용되는가
- `.moc3`와 `.model3.json`이 포함되어 있는가
- 표정과 터치 모션이 포함되어 있는가
- 립싱크 파라미터가 있는가
- 눈 깜빡임 파라미터가 있는가
- 텍스처가 모바일에서 지나치게 크지 않은가
- Cubism Core 버전과 호환되는가

개인용이라도 저작권과 모델 이용 약관은 적용된다. 무료 다운로드는 자유로운 수정이나 모든 용도의 사용을 의미하지 않는다.

## 7. 음성 인식 선택지

### Android 시스템 음성 인식

- 현재 Capacitor 플러그인으로 사용
- 구현이 간단하고 일본어 인식 품질이 양호
- 기기의 Google 앱과 네트워크 상태에 영향을 받을 수 있음

### Google Cloud Speech-to-Text

- 서버 기반
- 다양한 언어와 스트리밍 인식 지원
- 사용량에 따른 비용과 백엔드 구현 필요

### OpenAI 음성 인식

- 서버를 통해 음성 파일을 전달하여 텍스트로 변환
- 대화 백엔드와 통합하기 쉬움
- 업로드 지연, 비용, 개인정보 처리 고려 필요

### 기기 내 음성 인식

- 오프라인 처리와 개인정보 측면에서 유리
- 모델 용량과 모바일 성능 부담
- 언어별 품질 검증 필요

## 8. TTS 선택지

### VOICEVOX

- 일본어 캐릭터 음성에 적합
- 현재 테스트 API를 사용 중
- 공개 서비스에서는 API 안정성, 이용 약관 및 화자별 라이선스 확인 필요

### Android 기기 TTS

- 별도 서버 없이 사용 가능
- 기기마다 목소리와 품질이 다름
- 특정 제조사 TTS가 앱 사용을 제한할 수 있음

### 클라우드 TTS

예:

- Google Cloud Text-to-Speech
- Azure AI Speech
- Amazon Polly
- OpenAI 음성 합성

장점:

- 일관된 목소리와 품질
- 서버에서 음성 정책과 캐시 관리 가능

단점:

- 사용량 비용
- 네트워크 지연
- 캐릭터 음성의 이용 권한 확인 필요

## 9. 백엔드 선택지

### FastAPI

- Python 기반
- OpenAI 연동과 빠른 API 개발에 적합
- 데이터 검증과 자동 API 문서 지원

### Node.js

- 앱과 동일하게 TypeScript 사용 가능
- 실시간 통신과 스트리밍 응답 구현에 편리

### Firebase

- 인증, 데이터베이스, 푸시 알림을 빠르게 구성 가능
- 서버리스 함수에서 OpenAI를 호출할 수 있음
- 비용 구조와 공급자 종속성을 고려해야 함

### Supabase

- PostgreSQL, 인증 및 서버 함수를 함께 제공
- SQL 기반 데이터 모델이 필요한 토큰 장부에 적합

## 10. 결론

현재 목표인 터치 반응, 음성 대화, 현실 시간 상태 및 Android 우선 개발에는 `Live2D Cubism SDK for Web + TypeScript + Capacitor`가 가장 효율적이다.

Unity는 게임 요소가 커질 때, 네이티브 SDK는 성능 문제가 실제로 확인될 때 검토하는 것이 적절하다. Flutter나 React Native로 변경해도 Live2D 공식 통합 계층이 없기 때문에 현재 구조보다 단순해지지 않는다.

