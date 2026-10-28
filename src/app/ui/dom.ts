export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function append(
  parent: Node,
  ...children: readonly (Node | string | null | undefined)[]
): void {
  for (const child of children) {
    if (child === null || child === undefined) continue;
    if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    } else {
      parent.appendChild(child);
    }
  }
}

export function setAttrs(
  node: Element,
  attributes: Readonly<Record<string, string>>,
): void {
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
}

export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Readonly<Record<string, string>> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  setAttrs(node, attributes);
  return node;
}

export function svgPath(
  d: string,
  attributes: Readonly<Record<string, string>> = {},
): SVGPathElement {
  return svgEl('path', { d, ...attributes });
}

export function createIconButton(
  label: string,
  icon: SVGElement,
  className = 'icon-button',
): HTMLButtonElement {
  const button = el('button', className);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.append(icon);
  return button;
}

export function createActionButton(
  label: string,
  variant: 'primary' | 'secondary' | 'ghost' | 'danger',
  onClick: () => void,
): HTMLButtonElement {
  const button = el('button', `btn btn--${variant}`);
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}
