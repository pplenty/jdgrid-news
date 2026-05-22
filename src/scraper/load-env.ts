// ADR-0020: scraper 진입점에서 가장 먼저 import.
// tsx는 .env.local을 자동 로드하지 않으므로 명시적으로.
// 파일이 없으면 dotenv가 silent skip → CI에서 secrets 그대로 사용 가능.

import { config } from 'dotenv';

config({ path: '.env.local', override: false });
config({ path: '.env', override: false });
