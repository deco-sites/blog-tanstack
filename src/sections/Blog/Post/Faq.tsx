export interface FaqItem {
    /** @title Pergunta */
    question: string;
    /** @title Resposta (HTML) */
    answer: string;
}

export interface Props {
    /** @title Título da seção (opcional) */
    title?: string;
    /** @title Itens de perguntas e respostas */
    items?: FaqItem[];
}

export default function Faq(
    { title = "Perguntas Frequentes", items = [] }: Props,
) {
    if (!items.length) return null;

    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": items.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer.replace(/<[^>]+>/g, ""),
            },
        })),
    });

    return (
        <section
            className="my-10"
            aria-labelledby="faq-heading"
            itemScope
            itemType="https://schema.org/FAQPage"
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd }}
            />

            <h2
                id="faq-heading"
                className="text-xl font-bold text-[#1a1a18] tracking-tight mb-6 pb-3 border-b border-[#e4e3df]"
            >
                {title}
            </h2>

            <dl className="flex flex-col divide-y divide-[#f0efeb]">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="py-5"
                        itemScope
                        itemProp="mainEntity"
                        itemType="https://schema.org/Question"
                    >
                        <dt
                            className="font-semibold text-[#1a1a18] text-base leading-snug mb-2"
                            itemProp="name"
                        >
                            {item.question}
                        </dt>
                        <dd
                            itemScope
                            itemProp="acceptedAnswer"
                            itemType="https://schema.org/Answer"
                        >
                            <div
                                className="text-[#4a4a46] text-[0.98rem] leading-relaxed"
                                itemProp="text"
                                dangerouslySetInnerHTML={{
                                    __html: item.answer,
                                }}
                            />
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
