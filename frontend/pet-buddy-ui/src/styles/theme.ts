// 강아지 앱에 어울리는 따뜻하고 친근한 색상 테마
export const theme = {
  colors: {
    // 주요 색상 - 따뜻한 오렌지/코랄 계열
    primary: '#FF8C69',        // 따뜻한 코랄 오렌지
    primaryLight: '#FFB399',   // 밝은 코랄
    primaryDark: '#E6704A',    // 진한 코랄
    primaryBg: '#FFF4F0',      // 매우 연한 코랄 배경
    
    // 보조 색상 - 부드러운 브라운 계열
    secondary: '#D2B48C',      // 샌디 브라운
    secondaryLight: '#E5D4B1', // 밝은 샌디 브라운
    secondaryDark: '#B8966F',  // 진한 샌디 브라운
    secondaryBg: '#FAF7F2',    // 크림색 배경
    
    // 강조 색상 - 활기찬 노란색
    accent: '#FFD700',         // 골드
    accentLight: '#FFEB3B',    // 밝은 노란색
    accentDark: '#FFC107',     // 진한 골드
    accentBg: '#FFFEF7',       // 매우 연한 노란색 배경
    
    // 배경 색상
    background: '#FDF9F6',     // 따뜻한 화이트
    surface: '#FFFFFF',        // 순수 화이트
    surfaceLight: '#FEFCFA',   // 약간 따뜻한 화이트
    
    // 텍스트 색상
    textPrimary: '#2D1B14',    // 진한 브라운
    textSecondary: '#5D4037',  // 중간 브라운
    textTertiary: '#8D6E63',   // 연한 브라운
    textLight: '#A1887F',      // 매우 연한 브라운
    
    // 상태 색상 - 부드러운 톤
    success: '#81C784',        // 부드러운 그린
    successLight: '#C8E6C9',   // 연한 그린
    successBg: '#F1F8E9',      // 매우 연한 그린 배경
    
    warning: '#FFB74D',        // 부드러운 오렌지
    warningLight: '#FFCC82',   // 연한 오렌지
    warningBg: '#FFF8E1',      // 매우 연한 오렌지 배경
    
    error: '#E57373',          // 부드러운 레드
    errorLight: '#FFCDD2',     // 연한 레드
    errorBg: '#FFEBEE',        // 매우 연한 레드 배경
    
    info: '#64B5F6',           // 부드러운 블루
    infoLight: '#BBDEFB',      // 연한 블루
    infoBg: '#E3F2FD',         // 매우 연한 블루 배경
    
    // 중성 색상
    border: '#E8D5C9',         // 따뜻한 베이지 테두리
    borderLight: '#F0E6DB',    // 연한 베이지 테두리
    divider: '#EFEBE7',        // 구분선
    
    // 그림자 및 오버레이
    shadow: 'rgba(45, 27, 20, 0.1)',      // 따뜻한 그림자
    shadowDark: 'rgba(45, 27, 20, 0.15)', // 진한 그림자
    overlay: 'rgba(45, 27, 20, 0.5)',     // 오버레이
    
    // 강아지 테마 특별 색상
    pawPrint: '#8D6E63',       // 발자국 색상
    dogBrown: '#A1887F',       // 강아지 브라운
    dogGold: '#FFCC02',        // 강아지 골든 색상
    boneWhite: '#FFF8DC',      // 뼈다귀 화이트
    grassGreen: '#8BC34A',     // 잔디 그린
  },
  
  // 그라데이션
  gradients: {
    primary: ['#FF8C69', '#FFB399'],
    secondary: ['#D2B48C', '#E5D4B1'],
    warm: ['#FDF9F6', '#FAF7F2'],
    sunset: ['#FF8C69', '#FFD700'],
  },
  
  // 간격
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // 폰트 크기
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    title: 24,
    heading: 28,
    display: 32,
  },
  
  // 테두리 반지름
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // 그림자
  shadows: {
    sm: {
      shadowColor: 'rgba(45, 27, 20, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: 'rgba(45, 27, 20, 0.15)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: 'rgba(45, 27, 20, 0.2)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 5,
    },
  },
}

export type Theme = typeof theme