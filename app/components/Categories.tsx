export default function Categories() {
  const categories = [
    {
      name: "Kids Wear",
      image: "/kids.jpg",
    },
    {
      name: "Ladies Wear",
      image: "/ladies.jpg",
    },
    {
      name: "Trending",
      image: "/trending.jpg",
    },
    {
      name: "New Arrivals",
      image: "/new.jpg",
    },
  ];

  return (
    <section className="px-6 py-12">
      <h2 className="text-3xl font-bold text-black mb-8">
        Shop By Category
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-52 object-cover"
            />

            <h3 className="text-xl font-semibold text-center py-4 text-black">
              {item.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}