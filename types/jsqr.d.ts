// types/jsqr.d.ts
declare module 'jsqr' {
    export interface QRCode {
        binaryData: Uint8ClampedArray;
        data: string;
        chunks: any[];
        version: number;
        location: {
            topRightCorner: { x: number; y: number };
            topLeftCorner: { x: number; y: number };
            bottomRightCorner: { x: number; y: number };
            bottomLeftCorner: { x: number; y: number };
            topRightFinderPattern: { x: number; y: number };
            topLeftFinderPattern: { x: number; y: number };
            bottomLeftFinderPattern: { x: number; y: number };
            bottomRightAlignmentPattern?: { x: number; y: number };
        };
    }

    export interface Options {
        inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
    }

    function jsQR(
        data: Uint8ClampedArray,
        width: number,
        height: number,
        options?: Options
    ): QRCode | null;

    export default jsQR;
}

// For CDN usage
declare global {
    interface Window {
        jsQR?: (
            data: Uint8ClampedArray,
            width: number,
            height: number,
            options?: any
        ) => any;
    }
}