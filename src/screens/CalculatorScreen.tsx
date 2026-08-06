import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDisguiseCode } from '../storage/vaultStorage';

// A genuinely working calculator — not a fake screen — that also happens to compare
// the raw key sequence typed since the last clear/equals against a secret code. Typing
// that exact digit sequence and pressing "=" reveals SecureVault instead of showing a
// result. Anyone without the code who taps this icon just gets a real calculator,
// parentheses and history included.

type HistoryEntry = { id: string; expression: string; result: string };

// --- Expression parsing: a real recursive-descent parser (not immediate/sequential
// evaluation) so operator precedence and parentheses behave the way anyone would
// expect from an actual calculator, e.g. 2+3×4 = 14, not 20. ---

type Token = { type: 'num'; value: number } | { type: 'op'; value: '+' | '−' | '×' | '÷' } | { type: 'lparen' } | { type: 'rparen' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ type: 'num', value: parseFloat(expr.slice(i, j)) });
      i = j;
    } else if (c === '(') {
      tokens.push({ type: 'lparen' });
      i++;
    } else if (c === ')') {
      tokens.push({ type: 'rparen' });
      i++;
    } else if (c === '+' || c === '−' || c === '×' || c === '÷') {
      tokens.push({ type: 'op', value: c });
      i++;
    } else {
      i++;
    }
  }
  return tokens;
}

function evaluateExpression(expr: string): number {
  const tokens = tokenize(expr);
  if (tokens.length === 0) throw new Error('Empty expression');
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpr(): number {
    let value = parseTerm();
    while (peek() && peek().type === 'op' && ((peek() as any).value === '+' || (peek() as any).value === '−')) {
      const op = consume() as { type: 'op'; value: '+' | '−' };
      const rhs = parseTerm();
      value = op.value === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek() && peek().type === 'op' && ((peek() as any).value === '×' || (peek() as any).value === '÷')) {
      const op = consume() as { type: 'op'; value: '×' | '÷' };
      const rhs = parseFactor();
      if (op.value === '×') {
        value = value * rhs;
      } else {
        if (rhs === 0) throw new Error('Division by zero');
        value = value / rhs;
      }
    }
    return value;
  }

  function parseFactor(): number {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'op' && t.value === '−') {
      consume();
      return -parseFactor();
    }
    if (t.type === 'op' && t.value === '+') {
      consume();
      return parseFactor();
    }
    if (t.type === 'lparen') {
      consume();
      const value = parseExpr();
      const close = consume();
      if (!close || close.type !== 'rparen') throw new Error('Missing closing parenthesis');
      return value;
    }
    if (t.type === 'num') {
      consume();
      return t.value;
    }
    throw new Error('Unexpected token');
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error('Unexpected trailing input');
  return result;
}

function formatResult(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 'Error';
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
}

function trailingNumber(expr: string): string {
  const match = expr.match(/(\d+\.?\d*)$/);
  return match ? match[1] : '';
}

export default function CalculatorScreen({ onReveal }: { onReveal: () => void }) {
  const insets = useSafeAreaInsets();
  const [expression, setExpression] = useState('');
  const [justComputed, setJustComputed] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  const display = expression === '' ? '0' : expression;
  const lastChar = expression[expression.length - 1];
  const isOperatorChar = (c: string | undefined) => c === '+' || c === '−' || c === '×' || c === '÷';

  const pressDigit = (digit: string) => {
    setErrorFlash(false);
    if (justComputed) {
      setExpression(digit);
      setJustComputed(false);
      return;
    }
    setExpression(prev => prev + digit);
  };

  const pressDecimal = () => {
    setErrorFlash(false);
    if (justComputed) {
      setExpression('0.');
      setJustComputed(false);
      return;
    }
    const trailing = trailingNumber(expression);
    if (trailing.includes('.')) return;
    setExpression(prev => (prev === '' || isOperatorChar(lastChar) ? prev + '0.' : prev + '.'));
  };

  const pressOperator = (op: '+' | '−' | '×' | '÷') => {
    setErrorFlash(false);
    if (justComputed) {
      setExpression(prev => prev + op);
      setJustComputed(false);
      return;
    }
    if (expression === '') {
      if (op === '−') setExpression('−');
      return;
    }
    if (isOperatorChar(lastChar)) {
      setExpression(prev => prev.slice(0, -1) + op);
      return;
    }
    setExpression(prev => prev + op);
  };

  const pressParenToggle = () => {
    setErrorFlash(false);
    if (justComputed) {
      setExpression('(');
      setJustComputed(false);
      return;
    }
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;
    const canClose = openCount > closeCount && lastChar !== undefined && /[0-9)]/.test(lastChar);
    setExpression(prev => prev + (canClose ? ')' : '('));
  };

  const pressBackspace = () => {
    setErrorFlash(false);
    if (justComputed) {
      setExpression('');
      setJustComputed(false);
      return;
    }
    setExpression(prev => prev.slice(0, -1));
  };

  const pressPercent = () => {
    setErrorFlash(false);
    const trailing = trailingNumber(expression);
    if (!trailing) return;
    const pct = formatResult(parseFloat(trailing) / 100);
    setExpression(prev => prev.slice(0, prev.length - trailing.length) + pct);
  };

  const pressClear = () => {
    setExpression('');
    setJustComputed(false);
    setErrorFlash(false);
  };

  const pressEquals = async () => {
    const secret = await getDisguiseCode();
    if (expression === secret) {
      onReveal();
      return;
    }

    if (expression === '' || isOperatorChar(lastChar)) return;

    try {
      const result = evaluateExpression(expression);
      const resultStr = formatResult(result);
      if (resultStr === 'Error') throw new Error('Invalid result');
      setHistory(prev => [{ id: `${Date.now()}`, expression, result: resultStr }, ...prev].slice(0, 50));
      setExpression(resultStr);
      setJustComputed(true);
    } catch {
      setErrorFlash(true);
    }
  };

  const useHistoryResult = (entry: HistoryEntry) => {
    setExpression(entry.result);
    setJustComputed(true);
    setHistoryVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.historyBtn} onPress={() => setHistoryVisible(v => !v)} hitSlop={10}>
          <Ionicons name="time-outline" size={22} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
      </View>

      {historyVisible ? (
        <View style={styles.historyPanel}>
          <View style={styles.historyHeaderRow}>
            <Text style={styles.historyTitle}>History</Text>
            {history.length > 0 ? (
              <TouchableOpacity onPress={() => setHistory([])} hitSlop={8}>
                <Text style={styles.historyClear}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView contentContainerStyle={styles.historyList}>
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>No calculations yet</Text>
            ) : (
              history.map(entry => (
                <TouchableOpacity key={entry.id} style={styles.historyRow} onPress={() => useHistoryResult(entry)}>
                  <Text style={styles.historyExpr} numberOfLines={1}>
                    {entry.expression}
                  </Text>
                  <Text style={styles.historyResult} numberOfLines={1}>
                    = {entry.result}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.displayWrap}>
            <Text style={[styles.display, errorFlash && styles.displayError]} numberOfLines={2} adjustsFontSizeToFit>
              {errorFlash ? 'Error' : display}
            </Text>
          </View>

          <View style={styles.grid}>
            <Row>
              <Key label="AC" onPress={pressClear} variant="function" />
              <Key icon="backspace-outline" onPress={pressBackspace} variant="function" />
              <Key label="( )" onPress={pressParenToggle} variant="function" small />
              <Key label="÷" onPress={() => pressOperator('÷')} variant="operator" />
            </Row>
            <Row>
              <Key label="7" onPress={() => pressDigit('7')} />
              <Key label="8" onPress={() => pressDigit('8')} />
              <Key label="9" onPress={() => pressDigit('9')} />
              <Key label="×" onPress={() => pressOperator('×')} variant="operator" />
            </Row>
            <Row>
              <Key label="4" onPress={() => pressDigit('4')} />
              <Key label="5" onPress={() => pressDigit('5')} />
              <Key label="6" onPress={() => pressDigit('6')} />
              <Key label="−" onPress={() => pressOperator('−')} variant="operator" />
            </Row>
            <Row>
              <Key label="1" onPress={() => pressDigit('1')} />
              <Key label="2" onPress={() => pressDigit('2')} />
              <Key label="3" onPress={() => pressDigit('3')} />
              <Key label="+" onPress={() => pressOperator('+')} variant="operator" />
            </Row>
            <Row>
              <Key label="%" onPress={pressPercent} variant="function" />
              <Key label="0" onPress={() => pressDigit('0')} />
              <Key label="." onPress={pressDecimal} />
              <Key label="=" onPress={pressEquals} variant="operator" />
            </Row>
          </View>
        </>
      )}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Key({
  label,
  icon,
  onPress,
  variant = 'digit',
  small,
}: {
  label?: string;
  icon?: string;
  onPress: () => void;
  variant?: 'digit' | 'operator' | 'function';
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.key, variant === 'operator' && styles.keyOperator, variant === 'function' && styles.keyFunction]}
      activeOpacity={0.65}
      onPress={onPress}>
      {icon ? (
        <Ionicons name={icon} size={24} color="#fff" />
      ) : (
        <Text
          style={[
            styles.keyLabel,
            small && styles.keyLabelSmall,
            variant === 'operator' && styles.keyLabelOperator,
            variant === 'function' && styles.keyLabelFunction,
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const KEY_BG = '#2C2F35';
const FUNCTION_BG = '#484C54';
const ACCENT = '#FF9538';
const SCREEN_BG = '#14161A';
const BODY_BG = '#1E2024';
const KEY_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.35,
  shadowRadius: 4,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BODY_BG, paddingHorizontal: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 4 },
  historyBtn: { padding: 6 },
  displayWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: SCREEN_BG, borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  display: { color: '#fff', fontSize: 48, fontWeight: '300', textAlign: 'right' },
  displayError: { color: '#F16569' },
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: KEY_BG,
    alignItems: 'center',
    justifyContent: 'center',
    ...KEY_SHADOW,
  },
  keyOperator: { backgroundColor: ACCENT, shadowColor: '#8A4200' },
  keyFunction: { backgroundColor: FUNCTION_BG },
  keyLabel: { color: '#fff', fontSize: 26, fontWeight: '500' },
  keyLabelSmall: { fontSize: 19 },
  keyLabelOperator: { color: '#1E2024', fontWeight: '700' },
  keyLabelFunction: { color: '#fff', fontWeight: '600' },
  historyPanel: { flex: 1, backgroundColor: SCREEN_BG, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  historyTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  historyClear: { color: '#FF9538', fontSize: 13, fontWeight: '700' },
  historyList: { padding: 18, gap: 16 },
  historyEmpty: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', marginTop: 30 },
  historyRow: { marginBottom: 4 },
  historyExpr: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  historyResult: { color: '#fff', fontSize: 22, fontWeight: '500', marginTop: 2 },
});
