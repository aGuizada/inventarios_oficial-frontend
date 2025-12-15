import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private _isCollapsed = new BehaviorSubject<boolean>(false);
    isCollapsed$ = this._isCollapsed.asObservable();

    private _isMobileOpen = new BehaviorSubject<boolean>(false);
    isMobileOpen$ = this._isMobileOpen.asObservable();

    constructor() {
        // Optional: Load state from localStorage
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState) {
            this._isCollapsed.next(JSON.parse(savedState));
        }
    }

    toggle() {
        if (window.innerWidth < 1024) { // Mobile/Tablet breakpoint
            this._isMobileOpen.next(!this._isMobileOpen.value);
        } else {
            const newState = !this._isCollapsed.value;
            this._isCollapsed.next(newState);
            localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
        }
    }

    setCollapsed(isCollapsed: boolean) {
        this._isCollapsed.next(isCollapsed);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }

    setMobileOpen(isOpen: boolean) {
        this._isMobileOpen.next(isOpen);
    }

    get isCollapsed(): boolean {
        return this._isCollapsed.value;
    }

    get isMobileOpen(): boolean {
        return this._isMobileOpen.value;
    }
}
