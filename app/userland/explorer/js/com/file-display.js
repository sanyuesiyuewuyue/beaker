import { LitElement, html } from 'beaker://app-stdlib/vendor/lit-element/lit-element.js'
import { until } from 'beaker://app-stdlib/vendor/lit-element/lit-html/directives/until.js'
import { unsafeHTML } from 'beaker://app-stdlib/vendor/lit-element/lit-html/directives/unsafe-html.js'
import { joinPath } from 'beaker://app-stdlib/js/strings.js'
import MarkdownIt from 'beaker://app-stdlib/vendor/markdown-it.js'
import css from '../../css/com/file-display.css.js'

const md = MarkdownIt({
  html: false, // Enable HTML tags in source
  xhtmlOut: false, // Use '/' to close single tags (<br />)
  breaks: true, // Convert '\n' in paragraphs into <br>
  langPrefix: 'language-', // CSS language prefix for fenced blocks
  linkify: false, // Autoconvert URL-like text to links

  // Enable some language-neutral replacement + quotes beautification
  typographer: true,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
  quotes: '“”‘’',

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed
  highlight: undefined
})

export class FileDisplay extends LitElement {
  static get properties () {
    return {
      driveUrl: {type: String, attribute: 'drive-url'},
      pathname: {type: String},
      info: {type: Object},
      renderMode: {type: String, attribute: 'render-mode'}
    }
  }

  static get styles () {
    return css
  }

  get url () {
    return joinPath(this.driveUrl, this.pathname)
  }

  constructor () {
    super()
    this.driveUrl = undefined
    this.pathname = undefined
    this.info = undefined
    this.renderMode = undefined
  }

  async readFile () {
    try {
      var drive = new DatArchive(this.driveUrl)
      var file = await drive.readFile(this.pathname, 'utf8')

      if (this.pathname.endsWith('.md') && this.renderMode !== 'raw') {
        file = md.render(file)
        return html`<div class="markdown">${unsafeHTML(file)}</div>`
      }

      return html`<div class="text">${file}</div>`
    } catch (e) {
      return e.toString()
    }
  }

  // rendering
  // =

  render () {
    if (this.info.stat.isDirectory()) {
      if (this.info.stat.mount && this.info.stat.mount.key) {
        return this.renderMount()
      }
      return this.renderIcon('fas fa-folder')
    } 
    if (this.pathname.endsWith('.view')) {
      return this.renderIcon('fas fa-layer-group')
    }
    if (/\.(png|jpe?g|gif)$/.test(this.pathname)) {
      return this.renderImage()
    }
    if (/\.(mp4|webm|mov)$/.test(this.pathname)) {
      return this.renderVideo()
    }
    if (/\.(mp3|ogg)$/.test(this.pathname)) {
      return this.renderAudio()
    }
    if (this.info.stat.size > 1000000) {
      return html`<div class="too-big">This file is too big to display</div>`
    }
    return html`${until(this.readFile(), 'Loading...')}`
  }

  renderImage () {
    return html`<img src=${this.url}>`
  }

  renderVideo () {
    return html`<video controls><source src=${this.url}></video>`
  }

  renderAudio () {
    return html`<audio controls><source src=${this.url}></audio>`
  }

  renderIcon (icon) {
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="icon">
        <span class="${icon}"></span>
        ${this.info.subicon ? html`<span class="subicon ${this.info.subicon}"></span>` : ''}
      </div>
    `
  }

  renderMount () {
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="mount">
        <img src="asset:thumb:${this.info.mountInfo.url}">
        <div class="info">
          <div class="title">${this.info.mountInfo.title || 'Untitled'}</div>
          <div class="description">${this.info.mountInfo.description}</div>
        </div>
      </div>
    `
      // <div class="icon"><span class="fas fa-hdd"></span></div>
  }

  // events
  // =
}

customElements.define('file-display', FileDisplay)