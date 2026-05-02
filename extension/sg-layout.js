/**
 * sg-layout.js
 * Lightweight container wrapper for sg-layout event protocol.
 *
 * NOTE:
 * This project currently integrates the event contract and a minimal
 * custom element shell while we progressively migrate popup panels.
 */

import { SGL_EVENTS } from './sg-layout-events.js';

class SgLayout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._layout = null;
    this._root = document.createElement('div');
    this._root.className = 'sgl-root';
  }

  static get observedAttributes() {
    return ['layout'];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; width:100%; height:100%; }
        .sgl-root { width:100%; height:100%; box-sizing:border-box; }
      </style>
    `;
    this.shadowRoot.appendChild(this._root);
    this._parseLayoutAttribute();
    this.dispatchEvent(new CustomEvent(SGL_EVENTS.LAYOUT_READY, { bubbles: true, composed: true }));
  }

  attributeChangedCallback(name, _old, value) {
    if (name !== 'layout') return;
    try {
      this._layout = value ? JSON.parse(value) : null;
      this.dispatchEvent(new CustomEvent(SGL_EVENTS.LAYOUT_CHANGED, {
        bubbles: true,
        composed: true,
        detail: { tree: this.getLayout() }
      }));
    } catch (error) {
      console.warn('[sg-layout] invalid layout attribute JSON', error);
    }
  }

  _parseLayoutAttribute() {
    const raw = this.getAttribute('layout');
    if (!raw) return;
    this.attributeChangedCallback('layout', null, raw);
  }

  getLayout() {
    return this._layout ? JSON.parse(JSON.stringify(this._layout)) : null;
  }

  setLayout(tree) {
    this._layout = tree ? JSON.parse(JSON.stringify(tree)) : null;
    this.setAttribute('layout', JSON.stringify(this._layout || {}));
  }

  addPanel(config = {}) {
    this.dispatchEvent(new CustomEvent(SGL_EVENTS.CMD_ADD_PANEL, {
      bubbles: true,
      composed: true,
      detail: config
    }));
  }

  removePanel(id) {
    this.dispatchEvent(new CustomEvent(SGL_EVENTS.CMD_REMOVE_PANEL, {
      bubbles: true,
      composed: true,
      detail: { id }
    }));
  }

  focusPanel(id) {
    this.dispatchEvent(new CustomEvent(SGL_EVENTS.CMD_FOCUS_PANEL, {
      bubbles: true,
      composed: true,
      detail: { id }
    }));
  }
}

customElements.define('sg-layout', SgLayout);

export { SgLayout, SGL_EVENTS };
