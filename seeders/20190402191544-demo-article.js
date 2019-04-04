'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Articles', [
          {
            name: "demo article 1",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas suscipit dignissim nisl, non faucibus tortor volutpat a. Proin sollicitudin magna at tellus elementum sodales. Sed ut fermentum elit. In condimentum aliquet nunc tempus posuere. In hac habitasse platea dictumst. Praesent et scelerisque elit. Nam pretium, nisl non ultricies varius, eros lacus sodales nisi, sit amet egestas erat nisi at lectus. Fusce posuere blandit erat eu euismod. Ut a sem quis urna porta ultrices. Curabitur ut sapien sit amet lorem facilisis interdum. Curabitur ac nibh vulputate, feugiat elit eu, posuere lorem. In dolor magna, aliquam vitae fermentum at, fermentum ut ligula.\n" +
                "\n" +
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ac hendrerit arcu. Praesent vulputate tempus dui, non imperdiet nisl elementum quis. Suspendisse nec efficitur est. Sed tristique ipsum non porttitor maximus. Cras imperdiet velit sit amet velit tempus laoreet. Suspendisse lectus lacus, pellentesque id nisi vitae, semper accumsan diam. Aenean tincidunt, lorem eu sodales condimentum, orci nibh tincidunt elit, ornare iaculis lacus eros vitae dui. Quisque in fermentum nunc. Aenean luctus risus sit amet congue sollicitudin.\n" +
                "\n" +
                "Nam id ligula dignissim, lacinia libero nec, egestas neque. Vivamus nulla libero, volutpat eget rhoncus sed, euismod vel enim. Proin et mi quis nisi elementum imperdiet eu vitae tortor. Integer convallis pulvinar venenatis. Quisque vehicula, justo sed mollis mattis, diam odio faucibus est, sed pellentesque enim ex sit amet quam. Nunc sit amet tellus vitae orci volutpat fringilla eu faucibus sapien. Nunc accumsan justo ac pretium ultrices.\n" +
                "\n" +
                "Curabitur urna urna, iaculis fermentum quam eget, fringilla ultrices turpis. Donec a metus sed metus dapibus accumsan. Nunc lobortis ac diam at tempor. Mauris non augue risus. Morbi at massa eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam cursus nec orci quis gravida. Curabitur a efficitur massa, ac scelerisque tellus. Proin nulla quam, dictum a gravida a, auctor vitae quam. Vestibulum dignissim vitae magna eget viverra. Nam sit amet sagittis metus. In et nulla hendrerit, bibendum risus sed, porta quam. Donec vestibulum, turpis at varius luctus, lacus tellus congue nulla, et laoreet odio libero sed diam. Quisque eu neque finibus, commodo libero nec, cursus tortor. Maecenas id mauris rhoncus, hendrerit odio at, porttitor ligula.\n" +
                "\n" +
                "Sed mollis rutrum nulla, id interdum risus blandit id. Mauris ultricies enim quis sagittis tincidunt. Morbi accumsan quam non ex iaculis gravida id ut felis. Fusce tempus tortor eget congue posuere. Nunc eget finibus libero. Integer est risus, iaculis sed vehicula ac, posuere vitae lorem. Pellentesque elementum turpis odio, eu aliquam ipsum venenatis in. Proin nec metus in lacus efficitur scelerisque nec a ex. Phasellus convallis posuere ipsum et blandit. In id diam erat. Cras eu bibendum ante, vel scelerisque neque. ",
            createdAt: new Date()
          }
        ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Articles', null, {});
  }
};
