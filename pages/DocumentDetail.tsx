import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { Document, DocumentReview, User } from '../types';
// Hàm service sẽ cần được sửa để hỗ trợ tham số thứ 2 (lastReviewId)
import { fetchDocumentBySlug, incrementDownload, fetchDocumentReviews, addDocumentReview } from '../services/documents'; 
import { Loader2, ArrowLeft, Download, Star, FileText, Share2, Send, Link as LinkIcon, ExternalLink, MessageCircle } from 'lucide-react';
import { loginAnonymously } from '../services/auth';
import { ShareModal } from '../components/ShareModal';

// Khai báo một interface mở rộng DocumentReview (nếu cần)
interface ExpandedReview extends DocumentReview {
    isExpanded?: boolean;
}

const PAGE_SIZE = 5; // Cố định số lượng đánh giá tải mỗi lần
const MAX_REVIEW_LENGTH = 150; // Giới hạn ký tự cho nút xem thêm (tính năng phụ)

export const DocumentDetail: React.FC<{ currentUser: User; onOpenAuth: () => void }> = ({ currentUser, onOpenAuth }) => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	
	const [doc, setDoc] = useState<Document | null>(null);
	const [reviews, setReviews] = useState<ExpandedReview[]>([]); 
	const [loading, setLoading] = useState(true);
	
	// --- STATE MỚI CHO PHÂN TRANG ---
	const [hasMore, setHasMore] = useState(false); // Còn đánh giá để tải không?
	const [isFetchingMore, setIsFetchingMore] = useState(false); // Đang tải thêm không?

	// Review State (Giữ nguyên)
	const [userRating, setUserRating] = useState(5);
	const [reviewContent, setReviewContent] = useState('');
	const [submittingReview, setSubmittingReview] = useState(false);
	
	// Share State (Giữ nguyên)
	const [showShare, setShowShare] = useState(false);

	useEffect(() => {
		if (slug) loadData(slug);
	}, [slug]);

	// --- HÀM TẢI DỮ LIỆU BAN ĐẦU ---
	const loadData = async (slug: string) => {
		setLoading(true);
		const docData = await fetchDocumentBySlug(slug);
		if (docData) {
			setDoc(docData);
			
			// Tải 10 bài đầu tiên (truyền ID là null/undefined)
			// Hàm fetchDocumentReviews cần được sửa để hỗ trợ load more (xem Bước A)
			const initialReviews = await fetchDocumentReviews(docData.id); 
			
			setReviews(initialReviews.map(rev => ({ ...rev, isExpanded: false }) as ExpandedReview));
			
			// Nếu số lượng review tải được bằng PAGE_SIZE, tức là CÓ THỂ còn nữa
			setHasMore(initialReviews.length === PAGE_SIZE); 
		}
		setLoading(false);
	};

	// --- HÀM TẢI THÊM ĐÁNH GIÁ KHI NHẤN NÚT ---
	const handleLoadMore = async () => {
		if (!doc || isFetchingMore || !hasMore) return;

		setIsFetchingMore(true);
		const lastReview = reviews[reviews.length - 1]; // Lấy review cuối cùng
		
		try {
			// Tải 10 bài tiếp theo, bắt đầu sau bài cuối cùng đã có (truyền ID của bài cuối cùng)
			const nextReviews = await fetchDocumentReviews(doc.id, lastReview.id);

			setReviews(prev => [
				...prev,
				...nextReviews.map(rev => ({ ...rev, isExpanded: false }) as ExpandedReview)
			]);

			// Nếu số lượng review tải được ít hơn PAGE_SIZE, tức là hết
			setHasMore(nextReviews.length === PAGE_SIZE); 
		} catch (error) {
			console.error("Lỗi khi tải thêm đánh giá:", error);
			setHasMore(false); // Dừng tải để tránh vòng lặp lỗi
		} finally {
			setIsFetchingMore(false);
		}
	};
    
    // --- HÀM GỬI ĐÁNH GIÁ (RESET VỀ TRANG 1 VÀ TẢI LẠI) ---
	const handleSubmitReview = async () => {
		if (!doc || !reviewContent.trim()) return;
		
		let user = currentUser;
		if (user.isGuest) {
			try { user = await loginAnonymously(); } 
			catch { onOpenAuth(); return; }
		}

		setSubmittingReview(true);
		
		// 1. Gửi đánh giá và cập nhật thống kê (cần quyền đã sửa ở Rules)
		await addDocumentReview(user, doc.id, userRating, reviewContent, doc.rating, doc.ratingCount);
		
		// 2. Tải lại 10 bài đầu tiên để hiển thị bài mới nhất ngay lập tức
		const initialReviews = await fetchDocumentReviews(doc.id);
		
		setReviews(initialReviews.map(rev => ({ ...rev, isExpanded: false }) as ExpandedReview));
		setHasMore(initialReviews.length === PAGE_SIZE); // Đặt lại trạng thái "còn nữa"
		setReviewContent('');
		setSubmittingReview(false);
	};

    // --- HÀM ẨN/HIỆN NỘI DUNG DÀI (Giữ nguyên logic phụ trợ) ---
    const toggleExpand = (reviewId: string) => {
        setReviews(reviews.map(rev => 
            rev.id === reviewId ? { ...rev, isExpanded: !rev.isExpanded } : rev
        ));
    };

    // ... (Giữ nguyên các hàm phụ trợ khác: handleDownload, getFileIcon)
    
	if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]"><Loader2 className="animate-spin text-green-600" size={32} /></div>;
	
	if (!doc) return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
			<FileText size={64} className="text-gray-300 mb-4" />
			<h2 className="text-xl font-bold text-gray-700">Tài liệu không tồn tại</h2>
			<button onClick={() => navigate('/documents')} className="mt-4 text-green-600 font-bold hover:underline">Quay lại thư viện</button>
		</div>
	);

	return (
		<div className="min-h-screen bg-[#F7F7F5] pb-24 animate-fade-in pt-safe-top">
			{/* ... (Phần Header, Document Card, Author Info - GIỮ NGUYÊN) ... */}

			<div className="max-w-3xl mx-auto p-4 space-y-6">
			<div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
				
				{/* Reviews Section Title */}
				<h3 className="font-bold text-lg mb-6 flex items-center gap-2">
					<MessageCircle className="text-green-600" /> Đánh giá từ cộng đồng
				</h3>

				{/* Add Review (GIỮ NGUYÊN) */}
				<div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100">
                    <div className="text-center mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bạn thấy tài liệu này thế nào?</p>
                        <div className="flex items-center justify-center gap-2">
                            {[1,2,3,4,5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => setUserRating(star)} 
                                    className="focus:outline-none transition-transform hover:scale-125 active:scale-90"
                                >
                                    <Star size={32} className={`${star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} drop-shadow-sm`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            value={reviewContent} 
                            onChange={e => setReviewContent(e.target.value)} 
                            className="flex-1 p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" 
                            placeholder="Viết cảm nhận của bạn..." 
                        />
                        <button 
                            onClick={handleSubmitReview} 
                            disabled={submittingReview || !reviewContent.trim()} 
                            className="bg-green-600 text-white p-3 rounded-xl shadow-md hover:bg-green-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
                        >
                            {submittingReview ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
				

				{/* Review List (Sử dụng Reviews đã phân trang) */}
				<div className="space-y-6">
					{reviews.length === 0 && !loading && (
						<div className="text-center text-gray-400 py-4 text-sm italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
					)}
					{reviews.map(rev => (
						<div key={rev.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
							<div className="flex items-start justify-between mb-2">
								<div className="flex items-center gap-3">
									<img src={rev.userAvatar} className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
									<div>
										<span className="font-bold text-sm text-textDark block leading-none mb-1">{rev.userName}</span>
										<div className="flex gap-0.5">
											{[...Array(5)].map((_, i) => (
												<Star key={i} size={10} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
											))}
										</div>
									</div>
								</div>
								<span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
							</div>
							
							{/* Logic hiển thị bình luận với Xem thêm/Thu gọn */}
							{(() => {
								const isLongComment = rev.comment && rev.comment.length > MAX_REVIEW_LENGTH;
								
								// Class CSS để giới hạn dòng. Cần Typography Plugin để 'line-clamp-4' hoạt động
								const contentClasses = `text-sm text-gray-600 ml-11 transition-all duration-300 ${
									rev.isExpanded ? '' : 'line-clamp-4' 
								}`;

								return (
									<div className="relative">
										<p className={contentClasses}>
											{rev.comment}
										</p>
										
										{isLongComment && (
											<button 
												onClick={() => toggleExpand(rev.id)} 
												className="text-xs font-bold text-green-600 hover:text-green-700 mt-1 ml-11 block transition-colors"
											>
												{rev.isExpanded ? '<< Thu gọn' : '... Xem thêm'}
											</button>
										)}
									</div>
								);
							})()}
						</div>
					))}
					
					{/* --- NÚT TẢI THÊM (LOAD MORE) --- */}
					{hasMore && (
						<div className="pt-4 text-center">
							<button
								onClick={handleLoadMore}
								disabled={isFetchingMore}
								className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-70"
							>
								{isFetchingMore ? (
									<>
										<Loader2 className="animate-spin" size={16} /> Đang tải...
									</>
								) : (
									'Tải thêm đánh giá'
								)}
							</button>
						</div>
					)}

				</div>
			</div>
			</div>

			<ShareModal 
				isOpen={showShare}
				onClose={() => setShowShare(false)}
				url={window.location.href}
				title={doc.title}
			/>
		</div>
	);
};
