"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db, storage } from "../lib/firebase";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

interface DiaryEntry {
  dateStr: string;
  content: string;
  imageUrl: string | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [diaryMap, setDiaryMap] = useState<Record<string, DiaryEntry>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 로그인 상태일 때 양옆 광고 2개를 안전하게 호출
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        try {
          const ads = document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status="done"])');
          ads.forEach(() => {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          });
        } catch (e) {
          console.error("AdSense error:", e);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDiaryMap({});
      return;
    }
    const q = query(collection(db, "diaries"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newDiaryMap: Record<string, DiaryEntry> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as DiaryEntry;
        newDiaryMap[data.dateStr] = data;
      });
      setDiaryMap(newDiaryMap);
    });
    return () => unsubscribe();
  }, [user]);

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (error) { console.error("인증 오류:", error); }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const todayObj = new Date();
  const isCurrentMonth = todayObj.getFullYear() === year && (todayObj.getMonth() + 1) === month;
  const todayDate = todayObj.getDate();

  const years = useMemo(() => {
    const currentYearVal = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYearVal - 5 + i);
  }, []);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(Number(e.target.value), month - 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(year, Number(e.target.value) - 1, 1));
  };

  const openModal = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateStr(dateStr);
    
    const existingDiary = diaryMap[dateStr];
    setContent(existingDiary?.content || "");
    setPreviewUrl(existingDiary?.imageUrl || null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setContent("");
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveDiary = async () => {
    if (!user || !selectedDateStr) return;
    setUploading(true);

    try {
      let finalImageUrl = previewUrl;

      if (imageFile) {
        const options = { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(imageFile, options);
        const storageRef = ref(storage, `users/${user.uid}/${selectedDateStr}_${Date.now()}`);
        const uploadSnapshot = await uploadBytes(storageRef, compressedFile);
        finalImageUrl = await getDownloadURL(uploadSnapshot.ref);
      }

      const docRef = doc(db, "diaries", `${user.uid}_${selectedDateStr}`);
      await setDoc(docRef, {
        userId: user.uid,
        dateStr: selectedDateStr,
        content: content,
        imageUrl: finalImageUrl || null,
        updatedAt: new Date(),
      });

      closeModal();
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDiary = async () => {
    if (!user || !selectedDateStr) return;
    if (confirm("이 날의 추억을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "diaries", `${user.uid}_${selectedDateStr}`));
        closeModal();
      } catch (error) {
        console.error("삭제 오류:", error);
      }
    }
  };

  const handlePrint = () => {
    const printTitle = document.getElementById('printTitle');
    if (printTitle) {
      printTitle.innerText = `${year}년 ${month}월의 기록`;
    }
    window.print();
  };

  const currentMonthEntries = Object.values(diaryMap)
    .filter(entry => entry?.dateStr?.startsWith(`${year}-${String(month).padStart(2, "0")}`))
    .sort((a, b) => (a?.dateStr || "").localeCompare(b?.dateStr || ""));

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;

  return (
    <main className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-20">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print { 
          @page { size: landscape; margin: 15mm; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
          .print-calendar-grid { height: auto !important; margin-bottom: 20px !important; }
          .print-journal-section { page-break-before: always !important; break-before: page !important; padding-top: 10px !important; }
          .record-card { page-break-inside: avoid !important; break-inside: avoid !important; display: flex; gap: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 15px; background: white; box-shadow: none !important; }
          .record-image { width: 160px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #f3f4f6; }
        }
      `}} />

      <div className="no-print">
        <header className="pt-10 pb-6 text-center px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight">🐾 나의 소중한 추억 다이어리</h1>
          
          <div className="max-w-2xl mx-auto mb-6 text-gray-600 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="font-bold text-lg mb-2 text-gray-800">📸 일상을 특별하게 기록하세요</p>
            <p className="text-sm leading-relaxed">
              이곳은 소중한 사진과 추억을 캘린더 형태로 기록하고 관리하는 개인 웹 다이어리 서비스입니다.<br/>
              암호화된 클라우드 스토리지를 통해 안전하게 보관하며, PDF로 출력하여 영구적으로 간직할 수 있습니다.
            </p>
          </div>

          <div className="inline-block bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm mb-6">
            🔒 클라우드 보안 동기화 모드 작동 중
          </div>

          {user ? (
            <>
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-600">{user.email}님 환영합니다.</span>
                <button onClick={() => signOut(auth)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition">
                  로그아웃
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <select value={year} onChange={handleYearChange} className="border border-gray-300 rounded-lg px-3 py-2 font-bold text-base bg-white cursor-pointer shadow-sm">
                  {years.map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select value={month} onChange={handleMonthChange} className="border border-gray-300 rounded-lg px-3 py-2 font-bold text-base bg-white cursor-pointer shadow-sm">
                  {months.map((m) => <option key={m} value={m}>{m}월</option>)}
                </select>

                <button onClick={handlePrint} className="bg-[#a29bfe] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-[#8e85fc] transition">
                  🖨️ PDF 출력 (저널 양식)
                </button>
                <button onClick={() => setIsDonateOpen(true)} className="bg-yellow-400 text-gray-900 px-5 py-2.5 rounded-full font-bold shadow-md hover:-translate-y-0.5 transition flex items-center gap-2">
                  ☕ 개발자에게 커피 후원
                </button>
              </div>
            </>
          ) : (
            <div className="mb-8">
              <button onClick={handleGoogleLogin} className="bg-white border border-gray-300 px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-gray-50 transition flex items-center gap-3 mx-auto text-gray-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                Google 계정으로 안전하게 로그인
              </button>
            </div>
          )}
        </header>
      </div>

      <h1 id="printTitle" className="hidden print:block text-center text-3xl font-serif font-bold border-b-4 border-gray-800 pb-3 mb-6 mt-2 print:mx-4"></h1>

      {user ? (
        <div className="flex flex-col xl:flex-row justify-center gap-6 max-w-[1400px] mx-auto px-4 print:max-w-none print:block print:px-4 print:w-full box-border animate-in fade-in duration-500">
          
          {/* 1. 왼쪽 (또는 상단) 광고판 */}
          <aside className="w-full xl:w-[200px] flex-shrink-0 no-print">
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-2476231295737523"
                 data-ad-slot="7521237689"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </aside>

          {/* 2. 중앙 메인 콘텐츠 (달력 및 일지) */}
          <div className="flex-1 w-full max-w-5xl">
            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 print:gap-1 print-calendar-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div key={day} className={`text-center font-bold p-2 bg-yellow-100 rounded-lg shadow-sm print:shadow-none print:bg-gray-100 print:rounded-none ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-transparent border-none min-h-[120px] print:min-h-[13vh]"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const diary = diaryMap[dateStr];
                
                const isToday = isCurrentMonth && dayNum === todayDate;

                return (
                  <div 
                    key={dayNum} 
                    onClick={() => openModal(dayNum)}
                    className={`bg-white border rounded-xl min-h-[120px] p-2 relative overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md print:rounded-none print:min-h-[13vh] print:h-auto print:p-1 print:shadow-none print:break-inside-avoid ${isToday ? 'border-2 border-blue-400 ring-2 ring-blue-100 bg-blue-50/30' : 'border-gray-200'}`}
                  >
                    <span className={`font-bold z-10 ${isToday ? 'text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-sm print:bg-transparent print:w-auto print:text-gray-700' : 'text-gray-700'}`}>
                      {dayNum}
                    </span>
                    
                    {diary?.imageUrl && (
                      <img src={diary.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 z-0 print:opacity-40" />
                    )}
                    {diary?.content && (
                      <div className="mt-auto z-10 bg-white/85 backdrop-blur-sm px-1.5 py-1 rounded text-xs font-bold text-gray-800 truncate print:bg-white/95 print:whitespace-pre-wrap">
                        {diary.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 상세 일지 리스트 */}
            <div className="mt-12 print:mt-0 pb-10 print-journal-section">
              <h2 className="text-2xl font-bold mb-6 border-l-4 border-gray-800 pl-3 print:text-xl">이달의 상세 일지</h2>
              
              {currentMonthEntries.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {currentMonthEntries.map((entry) => (
                    <div key={entry.dateStr} className="record-card shadow-sm hover:shadow-md transition-shadow">
                      {entry.imageUrl && <img src={entry.imageUrl} className="record-image" alt="기록" />}
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-lg text-gray-900 border-b pb-2 mb-2">{entry.dateStr}의 기록</h3>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500 font-medium">
                  📭 아직 기록된 추억이 없습니다. 달력의 날짜를 클릭해 기록을 추가해 보세요!
                </div>
              )}
            </div>
          </div>

          {/* 3. 오른쪽 (또는 하단) 광고판 */}
          <aside className="w-full xl:w-[200px] flex-shrink-0 no-print">
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-2476231295737523"
                 data-ad-slot="7521237689"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </aside>

        </div>
      ) : (
        <div className="max-w-lg mx-auto mt-10 px-4 py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-500 no-print">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-gray-100">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">비공개 다이어리입니다</h2>
          <p className="text-gray-500 mb-8 font-medium text-sm leading-relaxed">
            개인용 일지는 로그인 후 확인하실 수 있습니다.<br/>
            구글 로봇 및 일반 방문자께서는 아래의 공개 출사 갤러리 페이지를 방문해 주세요!
          </p>
          
          <div className="pt-6 border-t border-gray-100">
            <a href="/blog" className="inline-flex items-center justify-center bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-600 transition w-full">
              📸 공개 사진 정보 블로그 보러가기
            </a>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold border-b pb-3 mb-4 text-gray-800">
              {selectedDateStr.split('-')[0]}년 {selectedDateStr.split('-')[1]}월 {selectedDateStr.split('-')[2]}일의 기록
            </h2>
            <div className="mb-4">
              <label className="block font-bold text-sm mb-2 text-gray-700">📸 사진 첨부 (최대 1.5MB 자동 압축)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3"/>
              {previewUrl && (
                <div className="rounded-lg overflow-hidden bg-gray-100 max-h-48 flex items-center justify-center">
                  <img src={previewUrl} alt="미리보기" className="w-full object-cover" />
                </div>
              )}
            </div>
            <div className="mb-6">
              <label className="block font-bold text-sm mb-2 text-gray-700">✏️ 오늘의 추억</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘 하루는 어땠나요? 소중한 순간을 기록하세요." 
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 text-sm bg-gray-50"
              />
            </div>
            <div className="flex justify-end gap-2">
              {diaryMap[selectedDateStr] && (
                <button onClick={handleDeleteDiary} className="bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500 mr-auto">
                  삭제
                </button>
              )}
              <button onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300">
                닫기
              </button>
              <button onClick={handleSaveDiary} disabled={uploading} className="bg-blue-400 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 disabled:bg-blue-300">
                {uploading ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDonateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">☕ 커피 한 잔 후원하기</h2>
            <div className="w-48 h-48 bg-gray-100 mx-auto border-2 border-dashed border-gray-300 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
              <img src="/my_qr.png" alt="토스뱅크 QR" className="w-full h-full object-contain" />
            </div>
            <p className="text-sm text-gray-500 mb-6 font-medium">스마트폰 카메라로 QR을 찍어주세요.</p>
            <button onClick={() => setIsDonateOpen(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full font-bold hover:bg-gray-300 w-full transition">
              닫기
            </button>
          </div>
        </div>
      )}

      <footer className="no-print mt-20 border-t border-gray-200 pt-6 pb-12 text-center text-xs text-gray-400">
        <p className="mb-2">© {year} 나의 소중한 추억 다이어리. All rights reserved.</p>
        <a href="/privacy" className="text-gray-500 hover:underline font-bold mx-2">
          개인정보처리방침
        </a>
      </footer>
    </main>
  );
}