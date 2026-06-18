// app/blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

interface Post {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
  settings?: string;
}

// 구글 로봇이 상시 읽어갈 수 있도록 배치한 풍부한 분량의 정보성 샘플 데이터
const SAMPLE_POSTS: Post[] = [
  {
    id: "sample-1",
    title: "야간 스냅 촬영을 위한 카메라 세팅과 빛갈림 표현 방법",
    date: "2026-06-15",
    category: "촬영 팁",
    content: "야간에 정갈하고 선명한 도시의 야경이나 스냅 사진을 담기 위해서는 몇 가지 필수적인 카메라 세팅이 필요합니다. 먼저 셔터스피드는 손떨림을 방지하기 위해 삼각대가 없다면 최소 1/60초 이상을 확보하는 것이 안전하며, 감도(ISO)는 노이즈를 억제하기 위해 가급적 100에서 400 사이로 낮게 유지하는 것이 좋습니다. 렌즈의 조리개 값은 F8에서 F11 사이로 조여줄 때 가로등이나 조명의 빛갈림이 가장 날카롭고 예쁘게 표현됩니다. 어두운 환경에서는 자동 초점(AF)이 잡히지 않고 앞뒤로 헤매는 경우가 많으므로, 수동 초점(MF) 모드로 전환한 뒤 화면을 확대하여 가장 선명한 피사체에 초점을 수동으로 맞추는 것이 결과물의 완성도를 비약적으로 높이는 방법입니다.",
    settings: "Body: 미러리스 크롭 | Lens: 30mm 단렌즈 | ISO: 200 | F: 9.0 | 1/4s"
  },
  {
    id: "sample-2",
    title: "단렌즈와 줌렌즈의 특성 비교 및 상황별 렌즈 선택 가이드",
    date: "2026-05-28",
    category: "장비 리뷰",
    content: "사진 촬영에 입문하면서 가장 고민하는 부분 중 하나는 단렌즈와 줌렌즈 중 어떤 것을 마운트할지 여부입니다. 단렌즈는 초점거리가 고정되어 있어 발줌을 팔아야 하는 번거로움이 있지만, 구조적으로 렌즈 알 수가 적어 화질이 매우 선명하고 F1.4나 F1.8과 같은 밝은 조리개 값을 확보할 수 있어 배경 흐림(아웃포커싱) 효과에 압도적인 우위를 가집니다. 반면 줌렌즈는 광각부터 준망원까지 하나의 렌즈로 커버할 수 있어 여행지나 기동성이 중요한 스냅 촬영에서 최고의 효율을 발휘합니다. 일상의 가벼운 산책이나 감성적인 카페 스냅, 인물 중심의 촬영에는 단렌즈를 권장하며, 넓은 풍경과 좁은 골목을 동시에 담아야 하는 여행길에는 가벼운 표준 줌렌즈가 좋은 선택이 됩니다.",
    settings: "Body: 미러리스 크롭 | Lens: 18-50mm 표준줌 | ISO: 100 | F: 4.0 | 1/250s"
  },
  {
    id: "sample-3",
    title: "도심 속 조용한 출사지 추천 및 주간 구도 잡는 법",
    date: "2026-05-12",
    category: "출사 기록",
    content: "멀리 떠나지 않아도 도심 속 골목길이나 오래된 건축물 주변은 훌륭한 출사지가 됩니다. 주간 촬영 시 가장 중요한 것은 빛의 방향을 파악하는 것입니다. 정오의 강한 직사광선 아래에서는 그림자가 너무 짙게 드리우기 때문에 건물의 질감을 살리기 어렵습니다. 따라서 해가 비스듬히 떠오르는 오전 시간이나 해가 지기 직전의 골든 아워를 활용하면 부드럽고 따뜻한 감성의 사진을 얻을 수 있습니다. 구도를 잡을 때는 격자선(Grid)을 켜고 삼분할 법칙에 맞추어 주인공이 되는 피사체를 교차점에 배치하는 것부터 시작해 보세요. 수평과 수직만 완벽하게 맞추어도 사진의 안정감이 배가되며, 시선이 머무는 리딩 라인을 찾아 길이나 벽면의 선을 따라 구도를 구성하면 깊이감 있는 입체적인 사진을 연출할 수 있습니다.",
    settings: "Body: 미러리스 크롭 | Lens: 56mm 준망원 | ISO: 100 | F: 2.8 | 1/500s"
  }
];

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);

  // 추후 파이어베이스에서 공개 게시글을 동적으로 관리하고 싶을 때를 위한 확장 영역
  useEffect(() => {
    const q = query(collection(db, "public_posts"), orderBy("date", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedPosts: Post[] = [];
        snapshot.docs.forEach((doc) => {
          fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(fetchedPosts);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-gray-800 font-sans pb-20">
      <header className="bg-white border-b border-gray-100 py-10 text-center px-4 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">📸 일상 출사 기록 갤러리</h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          사진 촬영 기술, 출사지 정보, 카메라 및 렌즈 설정값 등 유용한 사진 이야기를 공유하는 공개 공간입니다.
        </p>
        <div className="mt-4">
          <a href="/" className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 font-medium transition">
            🏠 내 개인 다이어리로 가기
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-12">
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-md">{post.category}</span>
                <time className="text-xs text-gray-400">{post.date}</time>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{post.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
              {post.settings && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 font-mono">
                  ⚙️ {post.settings}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}