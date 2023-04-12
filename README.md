![Ideal Supply logo](./dist/images/logos/idealsupply-logo-red.svg)


# Media Files 

[Logos](./dist/images/logos)

# Development

## Images

Images should be placed in the [src/images](./src/images) folder and be in svg format.

### Image variant configuration

Edit [src/images.yml](./src/images.yml)

The `images` section contains a list of image sources as specified by the `path` property and are relative to the `src` directory

Each source image has a list called `variations`

A variation has the following properties:

- `name`: the file name to use for the variation
- `format`: the output format. `svg` | `png` | `jpg` | `gif`
- `color` (optional): if set will replace `currentColor` with the specified color
- `background` (optional): if set will set the background color of the image. default: transparent (except jpg, white)  
- `size` (optional): Object to control the size of the variant
  - `mode`: `original` | `width` | `height` | `scale`;
    - `original` - default, keeps the original size of the source file
    - `width` - set the width of the variant to the number of pixels specified by `value`. preserves aspect ratio
    - `height` - set the height of the variant to the number of pixels specified by `value`. preserves aspect ratio
    - `scale` - scales the image by the factor provided in `value`
  - `value` - the value to be used for sizing. not required when `mode` is `original`



## Known Issues

### Jpg output
 - `background` is currently not working and will always be white 