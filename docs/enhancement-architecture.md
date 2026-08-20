# Enhancement Architecture: Technical Collaboration Upgrade

## Editor and formatting boundary

The technical editor enhancement remains entirely browser-local. Tiptap input rules will provide Markdown-style typing shortcuts, while `CodeBlockLowlight` will render fenced code blocks with client-side syntax highlighting. The provider supports fenced-code input such as three backticks followed by a space, and it relies on the local `lowlight` library for highlighting.[1] Tiptap input rules are intended for pattern-triggered transformations such as bold, lists, and Markdown-like shortcuts.[2]

The **Auto-format** action will be deterministic and local. It will normalize plain-text Markdown conventions such as headings, bullet lists, numbered lists, quotes, and fenced code into Tiptap structure. It must not call an AI service or upload document text, because such a call would violate the existing no-document-server-storage guarantee.

## Peer chat boundary

Room chat will use a second Yjs shared type within the existing room `Y.Doc`. A message will contain the sender’s local profile identity, content, and client timestamp. The same password-protected WebRTC provider that distributes document updates will distribute chat updates to connected peers; `y-indexeddb` will preserve them on the local device. The application server will have no chat-message database or chat API.

## Profile and settings boundary

First-use onboarding will require a browser-local display name and cursor color before the workspace is usable. Settings will retain profile and theme preferences in `localStorage`. This is a local profile, not a centrally authenticated identity or a public account. The app will use light mode by default and preserve the user’s chosen light/dark appearance locally.

## Concise invite boundary

The share flow will use the compact route `https://host/r/ROOMCODE#SECRET`. The short room code stays in the path, while the secret stays in the fragment. URL fragments are not included in HTTP requests. This reduces the route from `/room/ROOMCODE#key=SECRET` without introducing a URL-shortener database or disclosing the secret to the application server.

## References

[1]: [Tiptap CodeBlockLowlight Extension](https://tiptap.dev/docs/editor/extensions/nodes/code-block-lowlight)

[2]: [Tiptap Input Rules](https://tiptap.dev/docs/editor/api/input-rules)
