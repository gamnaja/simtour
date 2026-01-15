const CACHE_NAME = 'simtour-v3';
const ASSETS = [
    '/',
    '/#/',
    '/index.html',
    '/logo-v3.png'
];

self.addEventListener('install', (event) => {
    // 새로운 SW가 설치되자마자 대기 상태를 건너뛰고 바로 활성화
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    // 활성화 즉시 모든 클라이언트(탭) 제어권 가져오기
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // 구버전 캐시 삭제
            caches.keys().then((keyList) => {
                return Promise.all(keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                }));
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // HTML 문서 요청은 항상 네트워크를 우선 시도 (내용 갱신 보장)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/index.html');
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
