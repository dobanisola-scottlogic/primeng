import {NgModule,Component,ElementRef,OnDestroy,Input,Output,EventEmitter,Renderer2,
    ContentChildren,QueryList,ViewChild,NgZone} from '@angular/core';
import {trigger,state,style,transition,animate,AnimationEvent} from '@angular/animations';
import {CommonModule} from '@angular/common';
import {DomHandler} from 'primeng/dom';
import {Header,Footer,SharedModule} from 'primeng/api';

let idx: number = 0;

@Component({
selector: 'p-dialog',
template: `
    <div class="ui-dialog-wrapper" [ngClass]="{'ui-widget-overlay ui-dialog-mask': modal, 'ui-dialog-mask-scrollblocker': modal && blockScroll}" *ngIf="visible">
        <div #container [ngClass]="{'ui-dialog ui-widget ui-widget-content ui-corner-all ui-shadow':true, 'ui-dialog-rtl':rtl,'ui-dialog-draggable':draggable,'ui-dialog-resizable':resizable}"
            [ngStyle]="style" [class]="styleClass" (click)="containerClick = true"
            [@animation]="{value: 'visible', params: {transitionParams: transitionOptions}}" (@animation.start)="onAnimationStart($event)" role="dialog" [attr.aria-labelledby]="id + '-label'">
            <div #titlebar class="ui-dialog-titlebar ui-widget-header ui-helper-clearfix ui-corner-top" (mousedown)="initDrag($event)" *ngIf="showHeader">
                <span [attr.id]="id + '-label'" class="ui-dialog-title" *ngIf="header">{{header}}</span>
                <span [attr.id]="id + '-label'" class="ui-dialog-title" *ngIf="headerFacet && headerFacet.first">
                    <ng-content select="p-header"></ng-content>
                </span>
                <div class="ui-dialog-titlebar-icons">
                    <a *ngIf="maximizable" [ngClass]="{'ui-dialog-titlebar-icon ui-dialog-titlebar-maximize ui-corner-all':true}" tabindex="0" role="button" (click)="toggleMaximize($event)" (keydown.enter)="toggleMaximize($event)">
                        <span [ngClass]="maximized ? minimizeIcon : maximizeIcon"></span>
                    </a>
                    <a *ngIf="closable" [ngClass]="{'ui-dialog-titlebar-icon ui-dialog-titlebar-close ui-corner-all':true}" tabindex="0" role="button" (click)="close($event)" (keydown.enter)="close($event)" (mousedown)="onCloseMouseDown($event)">
                        <span [class]="closeIcon"></span>
                    </a>
                </div>
            </div>
            <div #content class="ui-dialog-content ui-widget-content" [ngStyle]="contentStyle">
                <ng-content></ng-content>
            </div>
            <div #footer class="ui-dialog-footer ui-widget-content" *ngIf="footerFacet && footerFacet.first">
                <ng-content select="p-footer"></ng-content>
            </div>
            <div *ngIf="resizable" class="ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se" style="z-index: 90;" (mousedown)="initResize($event)"></div>
        </div>
    </div>
`,
animations: [
    trigger('animation', [
        state('void', style({
            transform: 'scale(0.7)',
            opacity: 0
        })),
        state('visible', style({
            transform: 'none',
            opacity: 1
        })),
        transition('* => *', animate('{{transitionParams}}'))
    ])
]
})
export class Dialog implements OnDestroy {

    @Input() visible: boolean;

    @Input() header: string;

    @Input() draggable: boolean = true;

    @Input() resizable: boolean = true;

    @Input() positionLeft: number;

    @Input() positionTop: number;

    @Input() contentStyle: any;

    @Input() modal: boolean;

    @Input() closeOnEscape: boolean = true;

    @Input() dismissableMask: boolean;

    @Input() rtl: boolean;

    @Input() closable: boolean = true;

    @Input() get responsive(): boolean {
        return false;
    };
    
    set responsive(_responsive: boolean) {
        console.log("Responsive property is deprecated.");
    }

    @Input() appendTo: any;

    @Input() styleClass: string;

    @Input() showHeader: boolean = true;

    @Input() breakpoint: number = 640;

    @Input() blockScroll: boolean = false;

    @Input() autoZIndex: boolean = true;

    @Input() baseZIndex: number = 0;

    @Input() minX: number = 0;

    @Input() minY: number = 0;

    @Input() focusOnShow: boolean = true;

    @Input() maximizable: boolean;

    @Input() focusTrap: boolean = true;

    @Input() transitionOptions: string = '150ms cubic-bezier(0, 0, 0.2, 1)';

    @Input() closeIcon: string = 'pi pi-times';

    @Input() minimizeIcon: string = 'pi pi-window-minimize';

    @Input() maximizeIcon: string = 'pi pi-window-maximize';

    @ContentChildren(Header, {descendants: false}) headerFacet: QueryList<Header>;

    @ContentChildren(Footer, {descendants: false}) footerFacet: QueryList<Header>;
        
    @ViewChild('titlebar') headerViewChild: ElementRef;

    @ViewChild('content') contentViewChild: ElementRef;

    @ViewChild('footer') footerViewChild: ElementRef;

    @Output() onShow: EventEmitter<any> = new EventEmitter();

    @Output() onHide: EventEmitter<any> = new EventEmitter();

    @Output() visibleChange:EventEmitter<any> = new EventEmitter();

    container: HTMLDivElement;

    wrapper: HTMLElement;

    _visible: boolean;

    dragging: boolean;

    containerClick: boolean;

    documentDragListener: any;

    documentKeydownListener: any;

    documentDragEndListener: any;

    resizing: boolean;

    documentResizeListener: any;

    documentResizeEndListener: any;

    windowResizeListener: any;

    documentEscapeListener: Function;

    maskClickListener: Function;

    lastPageX: number;

    lastPageY: number;

    closeIconMouseDown: boolean;

    preWidth: string;

    preventVisibleChangePropagation: boolean;
        
    maximized: boolean;

    preMaximizeContentHeight: number;

    preMaximizeContainerWidth: number;

    preMaximizeContainerHeight: number;

    preMaximizePageX: number;

    preMaximizePageY: number;

    id: string = `ui-dialog-${idx++}`;

    _style: any = {};

    originalStyle: any;

    constructor(public el: ElementRef, public renderer: Renderer2, public zone: NgZone) {}

    @Input() get style(): any {
        return this._style;
    }
    set style(value:any) {
        if (value) {
            this._style = {...value};
            this.originalStyle = value;
        }
    }

    focus() {
        let focusable = DomHandler.findSingle(this.container, 'button');
        if(focusable) {
            this.zone.runOutsideAngular(() => {
                setTimeout(() => focusable.focus(), 5);
            });
        }
    }

    close(event: Event) {
        this.visibleChange.emit(false);
        event.preventDefault();
    }

    enableModality() {
        if(this.closable && this.dismissableMask) {
            this.maskClickListener = this.renderer.listen(this.wrapper, 'click', (event: any) => {
                if (!this.containerClick)
                    this.close(event);
                
                this.containerClick = false;
            });
        }

        if(this.modal && this.blockScroll) {
            DomHandler.addClass(document.body, 'ui-overflow-hidden');
        }
    }

    disableModality() {
        if (this.wrapper) {
            this.unbindMaskClickListener();

            if (this.modal && this.blockScroll) {
                DomHandler.removeClass(document.body, 'ui-overflow-hidden');
            }
            this.wrapper = null;
        }
    }

    toggleMaximize(event) {
        if (this.maximized)
            this.revertMaximize();
        else
            this.maximize();

        event.preventDefault();
    }

    maximize() {
        this.preMaximizePageX = parseFloat(this.container.style.top);
        this.preMaximizePageY = parseFloat(this.container.style.left);
        this.preMaximizeContainerWidth = DomHandler.getOuterWidth(this.container);
        this.preMaximizeContainerHeight = DomHandler.getOuterHeight(this.container);
        this.preMaximizeContentHeight = DomHandler.getOuterHeight(this.contentViewChild.nativeElement);

        this._style.top = this.preMaximizePageX ? '0px' : '';
        this._style.left = this.preMaximizePageY ? '0px' : '';
        this._style.width = '100vw';
        this._style.height = '100vh';
        let diffHeight = 0;
        if(this.headerViewChild && this.headerViewChild.nativeElement) {
            diffHeight += DomHandler.getOuterHeight(this.headerViewChild.nativeElement);
        }
        if(this.footerViewChild && this.footerViewChild.nativeElement) {
            diffHeight += DomHandler.getOuterHeight(this.footerViewChild.nativeElement);
        }
        this.contentViewChild.nativeElement.style.height = 'calc(100vh - ' + diffHeight +'px)';

        DomHandler.addClass(this.container, 'ui-dialog-maximized');
        if(!this.blockScroll) {
            DomHandler.addClass(document.body, 'ui-overflow-hidden');
        }

        this.moveOnTop();

        this.maximized = true;
    }

    revertMaximize() {
        this._style.top = this.preMaximizePageX ? this.preMaximizePageX + 'px' : '';
        this._style.left = this.preMaximizePageY ? this.preMaximizePageY + 'px' : '';
        this._style.width = this.preMaximizeContainerWidth + 'px';
        this._style.height = this.preMaximizeContainerHeight + 'px';
        this.contentViewChild.nativeElement.style.height = this.preMaximizeContentHeight + 'px';

        if (!this.blockScroll) {
            DomHandler.removeClass(document.body, 'ui-overflow-hidden');
        }

        this.maximized = false;

        this.zone.runOutsideAngular(() => {
            setTimeout(() => DomHandler.removeClass(this.container, 'ui-dialog-maximized'), 300);
        });
    }

    unbindMaskClickListener() {
        if (this.maskClickListener) {
            this.maskClickListener();
            this.maskClickListener = null;
        }
    }

    moveOnTop() {
        if (this.autoZIndex) {
            this.container.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
            this.wrapper.style.zIndex = String(this.baseZIndex + (DomHandler.zindex - 1));
        }
    }

    onCloseMouseDown(event: Event) {
        this.closeIconMouseDown = true;
    }

    initDrag(event: MouseEvent) {
        if (this.closeIconMouseDown) {
            this.closeIconMouseDown = false;
            return;
        }
        
        if (this.draggable) {
            this.dragging = true;
            this.lastPageX = event.pageX;
            this.lastPageY = event.pageY;
            DomHandler.addClass(document.body, 'ui-unselectable-text');
        }
    }

    onKeydown(event: KeyboardEvent) {
        if(this.focusTrap) {
            if(event.which === 9) {
                event.preventDefault();
                
                let focusableElements = DomHandler.getFocusableElements(this.container);

                if (focusableElements && focusableElements.length > 0) {
                    if (!document.activeElement) {
                        focusableElements[0].focus();
                    }
                    else {
                        let focusedIndex = focusableElements.indexOf(document.activeElement);

                        if (event.shiftKey) {
                            if (focusedIndex == -1 || focusedIndex === 0)
                                focusableElements[focusableElements.length - 1].focus();
                            else
                                focusableElements[focusedIndex - 1].focus();
                        }
                        else {
                            if (focusedIndex == -1 || focusedIndex === (focusableElements.length - 1))
                                focusableElements[0].focus();
                            else
                                focusableElements[focusedIndex + 1].focus();
                        }
                    }
                }
            }
        }
    }

    onDrag(event: MouseEvent) {
        if (this.dragging) {
            let containerWidth = DomHandler.getOuterWidth(this.container);
            let containerHeight = DomHandler.getOuterHeight(this.container);
            let deltaX = event.pageX - this.lastPageX;
            let deltaY = event.pageY - this.lastPageY;
            let offset = DomHandler.getOffset(this.container);
            let leftPos = offset.left + deltaX;
            let topPos = offset.top + deltaY;
            let viewport = DomHandler.getViewport();

            if (leftPos >= this.minX && (leftPos + containerWidth) < viewport.width) {
                this._style.left = leftPos + 'px';
                this.lastPageX = event.pageX;
                this.container.style.left = leftPos + 'px';
            }

            if (topPos >= this.minY && (topPos + containerHeight) < viewport.height) {
                this._style.top = topPos + 'px';
                this.lastPageY = event.pageY;
                this.container.style.top = topPos + 'px';
            }
        }
    }

    endDrag(event: MouseEvent) {
        if (this.draggable) {
            this.dragging = false;
            DomHandler.removeClass(document.body, 'ui-unselectable-text');
        }
    }

    initResize(event: MouseEvent) {
        if (this.resizable) {
            this.preWidth = null;
            this.resizing = true;
            this.lastPageX = event.pageX;
            this.lastPageY = event.pageY;
            DomHandler.addClass(document.body, 'ui-unselectable-text');
        }
    }

    onResize(event: MouseEvent) {
        if (this.resizing) {
            let deltaX = event.pageX - this.lastPageX;
            let deltaY = event.pageY - this.lastPageY;
            let containerWidth = DomHandler.getOuterWidth(this.container);
            let containerHeight = DomHandler.getOuterHeight(this.container);
            let contentHeight = DomHandler.getOuterHeight(this.contentViewChild.nativeElement);
            let newWidth = containerWidth + deltaX;
            let newHeight = containerHeight + deltaY;
            let minWidth = this.container.style.minWidth;
            let minHeight = this.container.style.minHeight;
            let offset = DomHandler.getOffset(this.container);
            let viewport = DomHandler.getViewport();

            if ((!minWidth || newWidth > parseInt(minWidth)) && (offset.left + newWidth) < viewport.width) {
                this._style.width = newWidth + 'px';
                this.container.style.width = this._style.width;
            }
            
            if ((!minHeight || newHeight > parseInt(minHeight)) && (offset.top + newHeight) < viewport.height) {
                this._style.height = newHeight + 'px';
                this.contentViewChild.nativeElement.style.height = contentHeight + deltaY + 'px';
            }

            this.lastPageX = event.pageX;
            this.lastPageY = event.pageY;
        }
    }

    onResizeEnd() {
        if (this.resizing) {
            this.resizing = false;
            DomHandler.removeClass(document.body, 'ui-unselectable-text');
        }
    }

    bindGlobalListeners() {
        if (this.focusTrap) {
            this.bindDocumentKeydownListener();
        }

        if (this.draggable) {
            this.bindDocumentDragListener();
            this.bindDocumentDragEndListener();
        }
        
        if (this.resizable) {
            this.bindDocumentResizeListeners();
        }
        
        if (this.closeOnEscape && this.closable) {
            this.bindDocumentEscapeListener();
        }
    }

    unbindGlobalListeners() {
        this.unbindDocumentDragListener();
        this.unbindDocumentKeydownListener();
        this.unbindDocumentDragEndListener();
        this.unbindDocumentResizeListeners();
        this.unbindDocumentEscapeListener();
    }

    bindDocumentKeydownListener() {
        this.zone.runOutsideAngular(() => {
            this.documentKeydownListener = this.onKeydown.bind(this);
            window.document.addEventListener('keydown', this.documentKeydownListener);
        });
    }

    unbindDocumentKeydownListener() {
        if(this.documentKeydownListener) {
            window.document.removeEventListener('keydown', this.documentKeydownListener);
            this.documentKeydownListener = null;
        }
    }

    bindDocumentDragListener() {
        this.zone.runOutsideAngular(() => {
            this.documentDragListener = this.onDrag.bind(this);
            window.document.addEventListener('mousemove', this.documentDragListener);
        });
    }

    unbindDocumentDragListener() {
        if(this.documentDragListener) {
            window.document.removeEventListener('mousemove', this.documentDragListener);
            this.documentDragListener = null;
        }
    }

    bindDocumentDragEndListener() {
        this.zone.runOutsideAngular(() => {
            this.documentDragEndListener = this.endDrag.bind(this);
            window.document.addEventListener('mouseup', this.documentDragEndListener);
        });
    }

    unbindDocumentDragEndListener() {
        if (this.documentDragEndListener) {
            window.document.removeEventListener('mouseup', this.documentDragEndListener);
            this.documentDragEndListener = null;
        }
    }

    bindDocumentResizeListeners() {
        this.zone.runOutsideAngular(() => {
            this.documentResizeListener = this.onResize.bind(this);
            this.documentResizeEndListener = this.onResizeEnd.bind(this);
            this.windowResizeListener = this.onWindowResize.bind(this);
            window.document.addEventListener('mousemove', this.documentResizeListener);
            window.document.addEventListener('mouseup', this.documentResizeEndListener);
            window.addEventListener('resize', this.windowResizeListener);
        });
    }

    unbindDocumentResizeListeners() {
        if (this.documentResizeListener && this.documentResizeEndListener && this.windowResizeListener) {
            window.document.removeEventListener('mousemove', this.documentResizeListener);
            window.document.removeEventListener('mouseup', this.documentResizeEndListener);
            window.removeEventListener('resize', this.windowResizeListener);
            this.documentResizeListener = null;
            this.documentResizeEndListener = null;
            this.windowResizeListener = null;
        }
    }

    onWindowResize() {
        if (this.maximized) {
            return;
        }
        
        let viewport = DomHandler.getViewport();
        if (viewport.width <= this.breakpoint) {
            if (!this.preWidth) {
                this.preWidth = this._style.width;
            }
            
            this._style.left = '0px';
            this._style.width = '100%';

            //outside zone
            this.container.style.left = this._style.left;
            this.container.style.width = this._style.width;
        }
        else {
            if (this.preWidth) {
                this._style.width = this.preWidth;
            }

            //outside zone
            this._style.left = '';
            this._style.top = '';
            this.container.style.left = this._style.left;
            this.container.style.top = this._style.top;
            this.container.style.width = this._style.width;
        }
    }

    bindDocumentEscapeListener() {
        this.documentEscapeListener = this.renderer.listen('document', 'keydown', (event) => {
            if (event.which == 27) {
                if (parseInt(this.container.style.zIndex) === (DomHandler.zindex + this.baseZIndex)) {
                    this.close(event);
                }
            }
        });
    }

    unbindDocumentEscapeListener() {
        if(this.documentEscapeListener) {
            this.documentEscapeListener();
            this.documentEscapeListener = null;
        }
    }

    appendContainer() {
        if(this.appendTo) {
            if(this.appendTo === 'body')
                document.body.appendChild(this.container);
            else
                DomHandler.appendChild(this.container, this.appendTo);
        }
    }

    restoreAppend() {
        if (this.container && this.appendTo) {
            this.el.nativeElement.appendChild(this.container);
        }
    }

    onAnimationStart(event: AnimationEvent) {
        switch(event.toState) {
            case 'visible':
                this.container = event.element;
                this.wrapper = this.container.parentElement;
                this.onShow.emit({});
                this.appendContainer();
                this.moveOnTop();
                this.bindGlobalListeners();
        
                if (this.maximized) {
                    DomHandler.addClass(document.body, 'ui-overflow-hidden');
                }
                
                if (this.modal) {
                    this.enableModality();
                }
        
                if (this.focusOnShow) {
                    this.focus();
                }
            break;

            case 'void':
                this.onContainerDestroy();
                this.onHide.emit({});
            break;
        }
    }

    onContainerDestroy() {
        this.unbindGlobalListeners();
        this.dragging = false;

        if (this.maximized) {
            DomHandler.removeClass(document.body, 'ui-overflow-hidden');
            this.maximized = false;
        }
        
        if (this.modal) {
            this.disableModality();
        }

        this.container = null;
        this.wrapper = null;

        this._style = this.originalStyle ? {...this.originalStyle} : {};
    }

    ngOnDestroy() {
        if (this.container) {
            this.restoreAppend();
            this.onContainerDestroy();
        }
    }

}

@NgModule({
imports: [CommonModule],
exports: [Dialog,SharedModule],
declarations: [Dialog]
})
export class DialogModule { }