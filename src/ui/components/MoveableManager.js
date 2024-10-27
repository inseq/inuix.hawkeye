export class MoveableManager {
  constructor(target, container, options = {}) {
    this.target = target;
    this.container = container;
    this.instance = null;
    this.options = options;
  }

  initialize() {
    if (this.instance) {
      this.destroy();
    }

    this.instance = new Moveable(this.container, {
      target: this.target,
      draggable: true,
      scalable: false,
      resizable: true,
      keepRatio: true,
      origin: false,
      throttleResize: 0,
      ...this.options
    });

    this.attachEventHandlers();
  }

  attachEventHandlers() {
    this.instance.on('drag', ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
      
      if (this.options.onDrag) {
        this.options.onDrag({ left, top });
      }
    });

    this.instance.on('dragEnd', () => {
      if (this.options.onDragEnd) {
        this.options.onDragEnd();
      }
    });

    this.instance.on('resize', ({ target, width, height, drag }) => {
      target.style.width = `${width}px`;
      target.style.height = `${height}px`;
      target.style.left = `${drag.left}px`;
      target.style.top = `${drag.top}px`;

      if (this.options.onResize) {
        this.options.onResize({ width, height, left: drag.left, top: drag.top });
      }
    });

    this.instance.on('resizeEnd', () => {
      if (this.options.onResizeEnd) {
        this.options.onResizeEnd();
      }
    });
  }

  updateTarget() {
    if (this.instance) {
      this.instance.updateTarget();
    }
  }

  updateRect() {
    if (this.instance) {
      this.instance.updateRect();
    }
  }

  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}