// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800 font-sans leading-relaxed">
      <h1 className="text-3xl font-bold mb-8 border-b pb-4">개인정보처리방침</h1>
      <p className="mb-6 text-gray-600">
        본 서비스('나의 소중한 추억 다이어리')는 이용자의 개인정보를 중요시하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률을 준수하고 있습니다.
      </p>
      
      <h2 className="text-xl font-bold mt-8 mb-3 text-gray-900">1. 수집하는 개인정보 항목</h2>
      <p className="mb-4 text-gray-700">
        본 서비스는 사용자가 Google 계정으로 안전하게 로그인할 수 있도록 인증 단계에서 이메일 주소 및 기본 프로필 식별 정보만을 수집합니다.
      </p>
      
      <h2 className="text-xl font-bold mt-8 mb-3 text-gray-900">2. 개인정보의 수집 및 이용 목적</h2>
      <p className="mb-4 text-gray-700">
        수집된 개인정보는 사용자의 고유 다이어리 데이터를 구분하고, 파이어베이스 클라우드 스토리지를 통해 데이터를 안전하게 동기화 및 보관하는 목적으로만 사용됩니다.
      </p>
      
      <h2 className="text-xl font-bold mt-8 mb-3 text-gray-900">3. 개인정보의 보유 및 이용 기간</h2>
      <p className="mb-4 text-gray-700">
        이용자의 개인정보는 서비스 이용 기간 동안 안전하게 보관되며, 사용자가 다이어리 작성을 중단하거나 데이터 삭제를 요청할 경우 즉시 파기됩니다.
      </p>
      
      <h2 className="text-xl font-bold mt-8 mb-3 text-gray-900">4. 구글 애드센스 쿠키 및 광고 게재에 관한 사항</h2>
      <p className="mb-6 text-gray-700">
        본 서비스는 구글(Google)에서 제공하는 웹 광고 서비스인 '구글 애드센스'를 탑재하고 있습니다. 구글을 포함한 제3자 제공업체는 사용자의 이전 웹사이트 방문 기록을 기반으로 맞춤형 광고를 게재하기 위해 쿠키(Cookie)를 사용합니다. 사용자는 구글의 광고 설정 페이지를 방문하여 맞춤설정 광고 게재를 차단할 수 있습니다.
      </p>

      <div className="mt-12 pt-6 border-t">
        <a href="/" className="inline-block bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-700 transition">
          🏠 메인 화면으로 돌아가기
        </a>
      </div>
    </main>
  );
}