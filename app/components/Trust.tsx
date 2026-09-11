export default function Trust() {
  const features = [
    {
      icon: "🚚",
      title: "Fast Delivery",
      desc: "Reliable doorstep delivery",
    },
    {
      icon: "💳",
      title: "Cash On Delivery",
      desc: "Pay after receiving order",
    },
    {
      icon: "🔒",
      title: "Secure Payment",
      desc: "Safe and trusted shopping",
    },
    {
      icon: "↩️",
      title: "Easy Returns",
      desc: "Hassle free return policy",
    },
  ];

  return (
    <section className="px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {features.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md p-6 text-center"
          >
            <div className="text-4xl">
              {item.icon}
            </div>

            <h3 className="text-lg font-bold text-black mt-3">
              {item.title}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}