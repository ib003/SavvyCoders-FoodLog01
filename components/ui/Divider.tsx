import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Theme';

interface DividerProps {
  text?: string;
  style?: any;
}

export function Divider({ text, style }: DividerProps) {
  if (text) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.line} />
        <Text style={styles.text}>{text}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={[styles.simpleLine, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border.light,
  },
  text: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    marginHorizontal: Theme.spacing.md,
  },
  simpleLine: {
    height: 1,
    backgroundColor: Theme.colors.border.light,
    marginVertical: Theme.spacing.md,
  },
});

