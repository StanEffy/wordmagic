/**
 * WordMagic Editor Component
 * Handles textarea/contenteditable input, typewriter mode, focus mode, typography and hotkeys.
 */

export class ProseEditor {
  constructor({ textareaEl, viewportEl, statusCallback, changeCallback }) {
    this.textarea = textareaEl;
    this.viewport = viewportEl;
    this.statusCallback = statusCallback;
    this.changeCallback = changeCallback;

    this.typewriterActive = false;
    this.focusModeActive = false;
    this.activeDoc = null;

    this.initEvents();
  }

  initEvents() {
    this.textarea.addEventListener('input', () => {
      this.handleInput();
    });

    this.textarea.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    this.textarea.addEventListener('keyup', () => {
      if (this.typewriterActive) {
        this.scrollTypewriter();
      }
    });

    this.textarea.addEventListener('click', () => {
      if (this.typewriterActive) {
        this.scrollTypewriter();
      }
    });
  }

  loadDocument(doc) {
    this.activeDoc = doc;
    this.textarea.value = doc.content || '';
    this.handleInput(true);
  }

  getContent() {
    return this.textarea.value;
  }

  setContent(text) {
    this.textarea.value = text;
    this.handleInput();
  }

  handleInput(isInitialLoad = false) {
    const text = this.textarea.value;
    if (this.changeCallback) {
      this.changeCallback(text, isInitialLoad);
    }
    if (this.typewriterActive) {
      this.scrollTypewriter();
    }
  }

  handleKeydown(e) {
    // Smart Tab indent support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      this.textarea.value = this.textarea.value.substring(0, start) + '    ' + this.textarea.value.substring(end);
      this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
      this.handleInput();
    }
  }

  scrollTypewriter() {
    if (!this.typewriterActive) return;

    // Approximate cursor line position in textarea
    const cursor = this.textarea.selectionStart;
    const textBefore = this.textarea.value.substring(0, cursor);
    const lineCount = (textBefore.match(/\n/g) || []).length;
    
    // Estimate lineHeight based on computed style
    const computed = window.getComputedStyle(this.textarea);
    const lineHeight = parseFloat(computed.lineHeight) || 28;
    const targetScrollY = lineCount * lineHeight;

    const viewportHeight = this.viewport.clientHeight;
    const desiredScroll = targetScrollY - (viewportHeight / 2) + 120;

    this.viewport.scrollTo({
      top: Math.max(0, desiredScroll),
      behavior: 'smooth'
    });
  }

  setTypewriterMode(active) {
    this.typewriterActive = active;
    if (active) {
      document.body.classList.add('typewriter-mode');
      this.scrollTypewriter();
    } else {
      document.body.classList.remove('typewriter-mode');
    }
  }

  setParagraphFocusMode(active) {
    this.focusModeActive = active;
    if (active) {
      document.body.classList.add('focus-mode-paragraph');
    } else {
      document.body.classList.remove('focus-mode-paragraph');
    }
  }

  setFontFamily(fontKey) {
    document.body.classList.remove('font-literata', 'font-ptserif', 'font-merriweather', 'font-inter', 'font-mono');
    document.body.classList.add(`font-${fontKey}`);
  }

  setFontSize(sizeKey) {
    document.body.classList.remove('size-sm', 'size-md', 'size-lg');
    document.body.classList.add(`size-${sizeKey}`);
  }

  setColumnWidth(widthKey) {
    document.body.classList.remove('width-narrow', 'width-standard', 'width-wide');
    document.body.classList.add(`width-${widthKey}`);
  }
}
