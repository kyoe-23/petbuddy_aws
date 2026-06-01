import { StyleSheet } from 'react-native'
import { theme } from './theme'

export const commonStyles = StyleSheet.create({
  // 컨테이너 스타일
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // 헤더 스타일
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  
  headerBackButton: {
    padding: theme.spacing.sm,
  },
  
  // 카드 스타일
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    ...theme.shadows.md,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  
  cardSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  // 버튼 스타일
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  
  buttonPrimaryText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  
  buttonSecondaryText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonOutlineText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  
  buttonSmall: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  
  buttonSmallText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  
  // 텍스트 스타일
  textPrimary: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
  },
  
  textSecondary: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  
  textTertiary: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.sm,
  },
  
  textHeading: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.heading,
    fontWeight: 'bold',
  },
  
  textTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.title,
    fontWeight: 'bold',
  },
  
  textCaption: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.xs,
  },
  
  // 입력 필드 스타일
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  
  inputLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  
  inputHelper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  
  inputError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  
  // 리스트 스타일
  listItem: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  
  listItemLast: {
    borderBottomWidth: 0,
  },
  
  // 뱃지 및 태그
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    alignSelf: 'flex-start',
  },
  
  badgeText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  
  badgeSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  
  badgeSuccess: {
    backgroundColor: theme.colors.success,
  },
  
  badgeWarning: {
    backgroundColor: theme.colors.warning,
  },
  
  badgeError: {
    backgroundColor: theme.colors.error,
  },
  
  // 구분선
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  
  // 간격
  marginXS: { margin: theme.spacing.xs },
  marginSM: { margin: theme.spacing.sm },
  marginMD: { margin: theme.spacing.md },
  marginLG: { margin: theme.spacing.lg },
  marginXL: { margin: theme.spacing.xl },
  
  paddingXS: { padding: theme.spacing.xs },
  paddingSM: { padding: theme.spacing.sm },
  paddingMD: { padding: theme.spacing.md },
  paddingLG: { padding: theme.spacing.lg },
  paddingXL: { padding: theme.spacing.xl },
  
  // 정렬
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  centerHorizontal: {
    alignItems: 'center',
  },
  
  centerVertical: {
    justifyContent: 'center',
  },
  
  row: {
    flexDirection: 'row',
  },
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // 강아지 테마 특별 스타일
  pawContainer: {
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.borderRadius.round,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dogProfileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryBg,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  warmBackground: {
    backgroundColor: theme.colors.secondaryBg,
  },
  
  cozyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.lg,
  },

  // 역할 전환 버튼 스타일
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.border,
    borderRadius: 9999,
    padding: 4,
    marginRight: theme.spacing.sm,
  },

  roleToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },

  activeRoleButton: {
    backgroundColor: theme.colors.surface,
  },

  inactiveRoleButton: {
    backgroundColor: 'transparent',
  },

  roleToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },

  activeRoleText: {
    color: theme.colors.textPrimary,
  },

  inactiveRoleText: {
    color: theme.colors.textSecondary,
  },
})

// 특별한 강아지 테마 스타일
export const dogThemeStyles = StyleSheet.create({
  pawButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.round,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  
  boneShape: {
    backgroundColor: theme.colors.boneWhite,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  
  grassBackground: {
    backgroundColor: theme.colors.grassGreen + '20', // 20% 투명도
  },
  
  goldenAccent: {
    color: theme.colors.dogGold,
    fontWeight: 'bold',
  },
  
  warmGradient: {
    // LinearGradient에서 사용할 색상
    colors: theme.gradients.warm,
  },
  
  sunsetGradient: {
    colors: theme.gradients.sunset,
  },
})