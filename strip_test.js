function stripTypeScript(code) {
  try {
    let clean = code
      // Remove type-only imports/exports
      .replace(/import\s+type\s+[^;]+;/g, '')
      .replace(/export\s+type\s+[^;]+;/g, '')
      // Remove interface/type definitions
      .replace(/(?:interface|type)\s+[A-Za-z0-9_]+\s*(?:=\s*)?\{[\s\S]*?\};?/g, '')
      // Remove variable type annotations: let x: number = 0; const arr: number[] = [];
      .replace(/(\b(?:let|const|var)\s+[A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$<>[\]|&\s]+(?=\s*=|\s*;|\s*,)/g, '$1')
      // Remove function return type annotations: function foo(): number[] { -> function foo() {
      .replace(/\)\s*:\s*[A-Za-z0-9_$<>[\]|&\s]+(?=\s*\{)/g, ')')
      // Remove parameter type annotations: (a: number, b: string) -> (a, b)
      .replace(/([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$<>[\]|&\s]+(?=[,)])/g, '$1')
      // Remove generic calls like Map<string, number>() -> Map()
      .replace(/<[A-Za-z0-9_$,\s]+>(?=\()/g, '')
      // Remove 'as Type' assertions
      .replace(/\s+as\s+[A-Za-z0-9_$<>[\]|&]+/g, '')
      // Remove non-null assertion operator: charMap.get(char)!
      .replace(/([A-Za-z0-9_$)\]])!/g, '$1');
    return clean;
  } catch (e) {
    return code;
  }
}

console.log(stripTypeScript('function solve(root: any, X: any): any {\n  return -1;\n}'));
