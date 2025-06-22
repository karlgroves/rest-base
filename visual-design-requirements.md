# Accessible Visual Design Requirements for Software Application


## Table of Contents

- [1. Color Contrast](#1-color-contrast)
  - [1.1 Contrast Ratio](#11-contrast-ratio)
  - [1.2 Color Usage](#12-color-usage)
- [2. Typography](#2-typography)
  - [2.1 Text Readability](#21-text-readability)
  - [2.2 Text Styles](#22-text-styles)
- [3. Layout and Structure](#3-layout-and-structure)
  - [3.1 Consistent Layout](#31-consistent-layout)
  - [3.2 Responsiveness](#32-responsiveness)
- [4. Interactive Elements](#4-interactive-elements)
  - [4.1 Focus Indicators](#41-focus-indicators)
  - [4.2 Touch Targets](#42-touch-targets)
- [5. Images and Media](#5-images-and-media)
  - [5.1 Images](#51-images)
- [6. Forms and Inputs](#6-forms-and-inputs)
  - [6.1 Form Labels](#61-form-labels)
  - [6.2 Form Instructions](#62-form-instructions)
  - [6.3 Error Messages](#63-error-messages)
- [7. Testing and Evaluation](#7-testing-and-evaluation)
  - [7.1 Automated Testing](#71-automated-testing)
  - [7.2 Manual Testing](#72-manual-testing)
- [8. Additional Considerations](#8-additional-considerations)
  - [8.1 Icons and Symbols](#81-icons-and-symbols)
  - [8.2 Visual Hierarchy](#82-visual-hierarchy)
  - [8.3 Interactive Elements](#83-interactive-elements)
- [9. Information Architecture and UX Design (From USWDS and GOV.UK Guidelines)](#9-information-architecture-and-ux-design-from-uswds-and-govuk-guidelines)
- [10. Additional Best Practices from Greenwich, W3C, and Princeton](#10-additional-best-practices-from-greenwich-w3c-and-princeton)
  - [10.1 Clarity and Simplicity](#101-clarity-and-simplicity)
  - [10.2 Content Flexibility](#102-content-flexibility)
  - [10.3 Alternatives and Control](#103-alternatives-and-control)
- [More information](#more-information)

To ensure the visual design of our software application meets the highest accessibility standards, the following detailed requirements must be adhered to. These requirements incorporate guidelines from Section 508, WCAG 2.2, EN 301 549, RGAA4, BITV, and best practices from IBM, USWDS, WAI, University of Greenwich, and UK government accessibility guidelines.

## 1. Color Contrast

### 1.1 Contrast Ratio

- **Text and Images of Text**: Ensure a contrast ratio of at least 7:1 for normal text and 4.5:1 for large text (18pt and larger or 14pt bold and larger) to achieve WCAG AAA compliance.
- **Graphical Objects and UI Components**: Ensure a contrast ratio of at least 3:1 against adjacent colors for graphical objects and user interface components.

### 1.2 Color Usage

- **Color Alone**: Do not use color as the sole method for conveying information. Provide additional cues such as text labels, patterns, or shapes.
- **Colorblindness Considerations**: Test designs for common forms of color blindness (e.g., protanopia, deuteranopia, tritanopia) to ensure information is accessible.

## 2. Typography

### 2.1 Text Readability

- **Font Size**: Use a minimum font size of 14pt for body text. Ensure text can be resized up to 200% without loss of content or functionality.
- **Line Height**: Ensure a minimum line height of 1.5 times the font size.
- **Letter Spacing**: Use a minimum letter spacing of 0.12em and word spacing of 0.16em.
- **Font Choice**: Use simple, sans-serif fonts. Avoid decorative fonts for body text. Ensure fonts are distinguishable, with clear differences between characters like 'I', 'l', '1', and 'O', '0'. We recommend you use one of two excellent fonts for this: Atkinson Hyperlegible or DM Sans

### 2.2 Text Styles

- **Avoid All Caps**: Refrain from using all uppercase letters for body text, as it can be difficult to read.
- **Italics and Bold**: Use italics and bold text sparingly to avoid readability issues.

## 3. Layout and Structure

### 3.1 Consistent Layout

- **Navigation**: Ensure consistent navigation structure across all pages. Provide a clear and predictable layout.
- **Landmarks**: Use ARIA landmarks (e.g., `role="navigation"`, `role="main"` or their corresponding HTML elements) to define regions of the page.

### 3.2 Responsiveness

- **Responsive Design**: Ensure the application is fully responsive and functions correctly on various screen sizes and orientations.
- **Viewport Settings**: Use appropriate viewport settings to allow for zooming and scaling on mobile devices.

## 4. Interactive Elements

### 4.1 Focus Indicators

- **Visible Focus**: Ensure all interactive elements (links, buttons, form fields) have a clear, visible focus state.
- **Focus Order**: Ensure a logical focus order that follows a natural reading order.

### 4.2 Touch Targets

- **Size**: Ensure touch targets (e.g., buttons, links) are at least 44x44 pixels.
- **Spacing**: Provide sufficient spacing between touch targets to prevent accidental activation.

## 5. Images and Media

### 5.1 Images

- **Alternative Text**: Provide meaningful alt text for all images. Use empty alt attributes for decorative images.
- **Complex Images**: For complex images (e.g., infographics), provide a detailed description or a data table as an alternative.

## 6. Forms and Inputs

### 6.1 Form Labels

- **Label Association**: Ensure all form inputs have associated labels. Use `for` attribute to link labels with their corresponding input elements.
- **Placeholder Text**: Use placeholder text as an example or hint, not as a replacement for labels.

### 6.2 Form Instructions

- **Clear Instructions**: Provide clear and concise instructions for completing forms. Place instructions before the input fields they relate to.

### 6.3 Error Messages

- **Descriptive Errors**: Provide descriptive error messages that clearly indicate the issue and how to correct it.
- **Error Prevention**: Implement mechanisms to prevent errors, such as input validation and confirmation prompts.

## 7. Testing and Evaluation

### 7.1 Automated Testing

- **Accessibility Testing Tools**: Use automated tools (e.g., Axe, WAVE) to identify potential accessibility issues.

### 7.2 Manual Testing

- **Screen Readers**: Test the application with screen readers (e.g., NVDA, JAWS) to ensure compatibility and usability.
- **Keyboard Navigation**: Test keyboard navigation to ensure all interactive elements are accessible and usable without a mouse.

## 8. Additional Considerations

### 8.1 Icons and Symbols

- **Simplicity**: Use simple, clear icons that are easily recognizable.
- **Alt Text**: Provide alt text for icons that convey important information or actions.
- **Size and Visibility**: Ensure icons are large enough to be easily seen and provide sufficient contrast against their background.

### 8.2 Visual Hierarchy

- **Short Sentences**: Use short, simple sentences to improve readability.
- **Headings and Lists**: Use headings, subheadings, and bulleted lists to break up text and organize content logically.
- **Minimize Distractions**: Avoid cluttered layouts and distracting backgrounds.

### 8.3 Interactive Elements

- **Distinct Appearance**: Make interactive elements (e.g., buttons, links) visually distinct from non-interactive content.
- **Labels**: Provide clear labels for interactive elements to ensure they are easily understood.

## 9. Information Architecture and UX Design (From USWDS and GOV.UK Guidelines)

- **Keyboard Accessibility**: Ensure all interactive elements are accessible via keyboard navigation alone.
- **Clear Instructions and Feedback**: Provide clear instructions and feedback for all user interactions, including forms and navigation.
- **Linear, Logical Layout**: Maintain a logical, linear layout that avoids unnecessary complexity and ensures ease of navigation.
- **Simple and Consistent Design**: Use simple, consistent design patterns across the application to enhance usability and reduce cognitive load.

## 10. Additional Best Practices from Greenwich, W3C, and Princeton

### 10.1 Clarity and Simplicity

- **Avoid Overloading Users**: Do not overload users with too much information at once. Use clear and simple designs to reduce cognitive load.

### 10.2 Content Flexibility

- **Adaptable Content**: Design content that can adapt to various devices and screen sizes. Ensure that content is flexible and reflows appropriately when resized.

### 10.3 Alternatives and Control

- **Provide Alternatives**: Ensure that non-text content has text alternatives, such as transcripts for audio and video content.
- **Control Over Content**: Provide users with control over content that starts automatically, such as videos and carousels.

## More information

For further details, you can visit the sites below:

- [Section 508 guide](https://www.section508.gov/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.01.01_60/en_301549v030101p.pdf)
- [USWDS Accessibility Documentation](https://esignsystem.digital.gov/documentation/accessibility/)
- [UK Government Accessibility Blog](https://accessibility.blog.gov.uk/2016/09/02/dos-and-donts-on-designing-for-accessibility/)
- [University of Greenwich Guidelines](https://www.gre.ac.uk/creating-inclusive-content/accessible-graphic-design)
- [WAI Design Tips](https://www.w3.org/WAI/tips/designing/)
- [Princeton Accessibility Guidelines](https://digital.accessibility.princeton.edu/how/design).
