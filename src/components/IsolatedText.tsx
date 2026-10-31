// Preserve every recorded character while keeping Latin/currency/number groups
// (including ISO dates and explicit offsets) in a stable inline direction.
export default function IsolatedText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(
          /([A-Za-z0-9\u0660-\u0669\u06f0-\u06f9][A-Za-z0-9\u0660-\u0669\u06f0-\u06f9\u066b\u066c.,:+%$€£/-]*(?:[ \u00a0]+[A-Za-z0-9\u0660-\u0669\u06f0-\u06f9][A-Za-z0-9\u0660-\u0669\u06f0-\u06f9\u066b\u066c.,:+%$€£/-]*)*)/u,
        )
        .map((part, index) =>
          index % 2 ? (
            <bdi key={index} dir="ltr">
              {part}
            </bdi>
          ) : (
            part
          ),
        )}
    </>
  );
}
