/**
 * sg-layout-events.js
 * Event name constants for the sg-layout framework.
 */

export const SGL_EVENTS = Object.freeze({
  REGISTER: 'sg-layout:register',

  PANEL_RESIZED: 'panel:resized',
  PANEL_FOCUSED: 'panel:focused',
  PANEL_HIDDEN: 'panel:hidden',
  PANEL_SHOWN: 'panel:shown',
  PANEL_CLOSED: 'panel:closed',
  TAB_CHANGED: 'tab:changed',
  LAYOUT_READY: 'layout:ready',
  LAYOUT_CHANGED: 'layout:changed',

  DRAG_START: 'sg-layout:drag-start',
  DRAG_END: 'sg-layout:drag-end',

  CMD_ADD_PANEL: 'sg-layout:add-panel',
  CMD_REMOVE_PANEL: 'sg-layout:remove-panel',
  CMD_FOCUS_PANEL: 'sg-layout:focus-panel',
  CMD_SET_LAYOUT: 'sg-layout:set-layout',

  SET_TITLE: 'sg-layout:set-title',
  REQUEST_FOCUS: 'sg-layout:request-focus',
  REQUEST_CLOSE: 'sg-layout:request-close'
});
