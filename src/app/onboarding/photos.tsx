import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OnboardingStep } from '@/components/onboarding-step';
import { requestPhotoPermission } from '@/services/photo-service';
export default function PhotoPermission() { const router = useRouter(); const [loading, setLoading] = useState(false); const request = async () => { setLoading(true); try { if (process.env.EXPO_OS !== 'web') await requestPhotoPermission(); } catch (error) { console.error('Trace photo onboarding request failed', error); } finally { setLoading(false); router.push('/onboarding/ready'); } }; return <OnboardingStep step="2 / 3" icon="images-outline" tone="lavender" title={'그날의 사진을\n그날의 장소와 연결해요'} body={'방문했던 시간에 촬영한 사진을 찾아\n하나의 추억으로 만들어 드립니다.'} action={() => void request()} actionLabel="사진 접근 허용" secondary={() => router.push('/onboarding/ready')} loading={loading} />; }
