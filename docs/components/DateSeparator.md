# Component: DateSeparator

## Description

Renders a sticky date separator within the message list (e.g., "Today", "Yesterday", "October 26, 2023"). It consists of the date text with a horizontal line on each side. This component is designed to work with `MessageVList` to create sticky headers that remain visible as the user scrolls through messages of a particular day.

## Import

```jsx
import DateSeparator from '@/components/DateSeparator';
```

## Props

| Prop         | Type     | Default | Required | Description                                       |
| :----------- | :------- | :------ | :------- | :------------------------------------------------ |
| `dateString` | `string` | -       | Yes      | The formatted date string to display (e.g., "Today"). |

## Usage

This component is typically used internally by `MessageVList` and not directly instantiated. `MessageVList` calculates when a new day begins in the message history and renders a `DateSeparator`.

```jsx
// Inside MessageVList's mapping logic
if (isNewDay) {
  return <DateSeparator key={dateId} dateString={formattedDate} />;
}
```