<script lang="ts">
  import AboutImage from '$lib/aboutimage.svelte';
</script>

<div class="max-w-prose mx-auto flex flex-col gap-6">
  <p>
    Have you ever seen text around the internet that appeared to be using a different font in a
    place where that shouldn't be possible?
  </p>

  <AboutImage src="/yt-comment.png" alt="YouTube comment with letter-like characters">
    Text in comment, post, etc. where font controls are not available.
  </AboutImage>

  <p>...or with strange marks around a character?</p>

  <AboutImage src="/zalgo.png" alt="Text in a famous Stack Overflow answer">
    Text in a famous Stack Overflow answer.
    <a href="https://stackoverflow.com/a/1732454/235992" class="link"
      >https://stackoverflow.com/a/1732454/235992</a
    >
  </AboutImage>

  <p>...or that was in a different script?</p>

  <AboutImage src="/weibo.png" alt="Wikipedia page for Weibo">
    Wikipedia page in another language.
    <a href="https://zh.m.wikipedia.org/wiki/%E6%96%B0%E6%B5%AA%E5%BE%AE%E5%8D%9A" class="link"
      >https://zh.m.wikipedia.org/wiki/%E6%96%B0%E6%B5%AA%E5%BE%AE%E5%8D%9A</a
    >
  </AboutImage>

  <p>...or that looked like a picture (or emoji)?</p>

  <AboutImage src="/merperson.png" alt="Merperson emoji: 🧜🏻, 🧜🏼, 🧜🏽, 🧜🏾, 🧜🏿..">
    "Merperson" emoji: 🧜🏻, 🧜🏼, 🧜🏽, 🧜🏾, 🧜🏿.
    <a href="https://www.unicode.org/Public/emoji/14.0/emoji-test.txt" class="link"
      >https://www.unicode.org/Public/emoji/14.0/emoji-test.txt</a
    >
  </AboutImage>

  <p>
    <span class="font-bold">Well, then you've seen the wide extent of Unicode characters.</span>
    There are over 144,000 characters covered by the standard, each with their own semantics.
  </p>

  <p>
    And that's where Unicode X-Ray may be helpful — it helps you take a look closer look at the
    characters you that you input:
  </p>

  <ol class="list-disc ml-4">
    <li>Provides names for characters, which help you understand how they're to be used.</li>
    <li>
      Links to reference material about each character and displays its unique identifier, called a
      <span class="italic">codepoint</span>.
    </li>
    <li>
      Performs <span class="italic">grapheme clustering</span>, where multiple characters attain
      another interpretation when they are combined. Each row represents one grapheme.
    </li>
    <li>
      Lets you normalize your input into different forms that may transform or reorder your text.
    </li>
  </ol>

  <p>
    That's all. This is just a toy that helps me (and maybe you) answer, "How did they write that?"
    And all you have to do is copy & paste the text into this website.
  </p>

  <div class="mt-4">
    <a href="/" class="link">Back to home</a>
  </div>
</div>
