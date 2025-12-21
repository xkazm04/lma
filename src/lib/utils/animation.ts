/**
 * Animation utilities for consistent timing and delays across the application
 */

export type AnimationSpeed = 'fast' | 'standard' | 'slow';

/**
 * Delay presets in milliseconds per item
 */
const DELAY_PRESETS: Record<AnimationSpeed, number> = {
    fast: 50,
    standard: 100,
    slow: 200,
};

/**
 * Get animation delay for staggered animations
 * @param index - The index of the item in the list
 * @param speed - The animation speed preset
 * @returns Delay in milliseconds
 * 
 * @example
 * const delay = getAnimationDelay(0, 'standard'); // 0ms
 * const delay = getAnimationDelay(2, 'fast'); // 100ms
 */
export function getAnimationDelay(index: number, speed: AnimationSpeed = 'standard'): number {
    return index * DELAY_PRESETS[speed];
}

/**
 * Get animation delay as a CSS string
 * @param index - The index of the item in the list
 * @param speed - The animation speed preset
 * @returns CSS delay string (e.g., "100ms")
 * 
 * @example
 * <div style={{ animationDelay: getAnimationDelayString(2, 'fast') }} />
 */
export function getAnimationDelayString(index: number, speed: AnimationSpeed = 'standard'): string {
    return `${getAnimationDelay(index, speed)}ms`;
}

/**
 * Get animation delay style object
 * @param index - The index of the item in the list
 * @param speed - The animation speed preset
 * @returns Style object with animationDelay and animationFillMode
 * 
 * @example
 * <div style={getAnimationDelayStyle(2, 'fast')} />
 */
export function getAnimationDelayStyle(index: number, speed: AnimationSpeed = 'standard'): React.CSSProperties {
    return {
        animationDelay: getAnimationDelayString(index, speed),
        animationFillMode: 'both',
    };
}
