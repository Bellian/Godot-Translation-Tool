const emotions = [
    'happy',
    'sad',
    'angry',
    'afraid',
    'thankful',
    'surprised',
    'loving',
]

const dialogOptions = [] as string[];

export const possibleEvents = {
    'getEmotion': emotions,
    'background': null,
    'interact': null,
    'endDay': null,
}

export const possibleConditions = {
    'hasEmotion': emotions,
    'didDialog': dialogOptions,
    'didDays': null,
}