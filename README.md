# Stack-on-scroll

![npm](https://img.shields.io/npm/v/stack-on-scroll?color=%237159c1) ![npm bundle size](https://img.shields.io/bundlephobia/min/stack-on-scroll) ![license](https://img.shields.io/npm/l/stack-on-scroll) ![issues](https://img.shields.io/github/issues/your-username/stack-on-scroll)

**Stack-on-scroll** is a lightweight and customizable JavaScript library to create visually engaging stacking effects as the user scrolls down the page. Ideal for storytelling and interactive layouts, it provides an elegant way to stack elements on top of each other dynamically.

---

## ✨ Features

- **Easy to Use:** Minimal setup to get started with stacking effects.
- **Highly Customizable:** Configure speed, transition effects, and offset options.
- **Lightweight & Fast:** No dependencies, quick to load, and smooth transitions.
- **Flexible Design:** Works with any HTML structure and is easily stylable.

---

## 📦 Installation

Install **Stack-on-scroll** via NPM or Yarn:

```bash
npm install stack-on-scroll
# or
yarn add stack-on-scroll
```

---

## 🚀 Quick Start

Follow these steps to get **Stack-on-scroll** running in your project.

### 1. Import and Initialize

```javascript
import { Card, Outer } from 'stack-on-scroll';

function App() {
  return (
    <>
      <Outer>
        <Card index={1}>

          // Here is your custom code

        </Card>
        <Card index={2}>
          
          // Here is your custom code

        </Card>
        <Card index={3}>
          
          // Here is your custom code
        
        </Card>
      </Outer>
    </>
  );
}

export default App;
```



---

## ⚙️ Configuration Options

| Option            | Type     | Default  | Description                                                                           |
|-------------------|----------|----------|---------------------------------------------------------------------------------------|
| `container`       | `string` | Required | Selector for the container that holds the stackable items                             |
| `items`           | `string` | Required | Selector for the stackable items within the container                                 |
| `offset`          | `number` | `100`    | Vertical scroll offset (in pixels) for triggering the stacking effect                 |
| `speed`           | `number` | `0.5`    | Transition speed of stacking effect, ranging from `0` (instant) to `1` (slow)         |
| `transitionEffect`| `string` | `'fade'` | Type of transition effect for the stacking (`'fade'`, `'slide'`, `'rotate'`, etc.)    |

### Example

```javascript
import stackOnScroll from 'stack-on-scroll';

stackOnScroll({
   container: '#my-stack',
   items: '.my-item',
   offset: 150,
   speed: 0.8,
   transitionEffect: 'slide'
});
```

---

## 📚 Examples

Here's a quick example of how **Stack-on-scroll** can be used for a storytelling effect:

```html
<div id="my-stack">
  <div class="my-item">Welcome</div>
  <div class="my-item">Our Story</div>
  <div class="my-item">Our Mission</div>
  <div class="my-item">Get in Touch</div>
</div>
```

For more examples and customization options, check out the [Documentation](https://github.com/your-username/stack-on-scroll/wiki).

---

## 💻 Development

Want to contribute? Great! Follow these steps to set up your local environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/stack-on-scroll.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm start
   ```

4. Build the project:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

## 🌟 Support

If you find **Stack-on-scroll** useful, please consider giving it a ⭐ on GitHub or sharing it with others!